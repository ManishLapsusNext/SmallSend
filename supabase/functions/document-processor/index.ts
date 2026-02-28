import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts"

// document-processor Edge Function
// Handles conversion of PPTX, DOCX, XLSX, and PDF to interactive JPG slides

serve(async (req: Request) => {
  console.log('--- Function Invoked ---');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: { 
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      } 
    })
  }
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get the request body
    const body = await req.json().catch(() => ({}));
    const { record, deckId: manualDeckId } = body;
    
    let deck;
    if (record) {
      deck = record;
    } else if (manualDeckId) {
      console.log(`[Step 1] Fetching deck from DB: ${manualDeckId}`);
      const { data, error } = await supabaseClient.from('decks').select('*').eq('id', manualDeckId).single();
      if (error) throw new Error(`Database fetch error: ${error.message}`);
      deck = data;
    }

    if (!deck) throw new Error("No deck found for processing");
    console.log(`[Step 1 OK] Processing deck: ${deck.title} (${deck.id})`);

    const apiKey = Deno.env.get('CONVERT_API_SECRET');
    if (!apiKey) throw new Error("CONVERT_API_SECRET is not set in Supabase Secrets.");

    // Extract file path from URL
    const urlParts = deck.file_url.split('/public/decks/');
    if (urlParts.length < 2) throw new Error(`Could not parse file path from URL: ${deck.file_url}`);
    
    const filePath = urlParts[1];
    const fileName = filePath.split('/').pop() || 'document.pptx';
    console.log(`[Step 2] Downloading file: ${filePath}`);

    // Download the file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabaseClient
      .storage
      .from('decks')
      .download(filePath);

    if (downloadError) throw new Error(`Storage download error: ${downloadError.message}`);
    if (!fileData) throw new Error("File data is empty after download");
    console.log(`[Step 2 OK] Downloaded ${fileData.size} bytes`);

    const fileExt = fileName.split('.').pop()?.toLowerCase() || 'pdf';
    
    // Convert directly to JPG via ConvertAPI
    console.log(`[Step 3] Sending to ConvertAPI (${fileExt} to jpg)...`);
    const convertUrl = `https://v2.convertapi.com/convert/${fileExt}/to/jpg?Secret=${apiKey}`;
    
    const formData = new FormData();
    // We use a clean fileName without path slashes for the API
    formData.append('File', fileData, fileName);

    const convertResponse = await fetch(convertUrl, {
      method: 'POST',
      body: formData,
    });

    if (!convertResponse.ok) {
      const errorText = await convertResponse.text();
      let errorMessage = `ConvertAPI error (${convertResponse.status})`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.Message || errorMessage;
      } catch (_) {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const convertResult = await convertResponse.json();
    const convertedFiles = convertResult.Files; 
    
    if (!convertedFiles || !Array.isArray(convertedFiles) || convertedFiles.length === 0) {
      console.error('ConvertAPI Result:', JSON.stringify(convertResult));
      throw new Error("ConvertAPI successful but returned no files/images");
    }

    console.log(`[Step 3 OK] ConvertAPI success: ${convertedFiles.length} images generated`);

    const imageUrls = [];
    const deckSlug = deck.slug;

    // Upload each image to Supabase Storage
    for (let i = 0; i < convertedFiles.length; i++) {
      const fileInfo = convertedFiles[i];
      const fileUrl = fileInfo.Url || fileInfo.url || fileInfo.URL;
      const base64Data = fileInfo.FileData || fileInfo.filedata;
      
      let imageBuffer: ArrayBuffer | Uint8Array;

      if (fileUrl) {
        console.log(`[Step 4] Downloading page ${i + 1}/${convertedFiles.length} from URL...`);
        const imageResponse = await fetch(fileUrl);
        if (!imageResponse.ok) throw new Error(`Failed to download page ${i + 1} from URL`);
        imageBuffer = await imageResponse.arrayBuffer();
      } else if (base64Data) {
        console.log(`[Step 4] Decoding page ${i + 1}/${convertedFiles.length} from base64...`);
        imageBuffer = decode(base64Data);
      } else {
        console.error(`[Page ${i+1}] Missing URL and FileData in fileInfo:`, JSON.stringify(fileInfo));
        continue;
      }

      const imagePath = `${deck.user_id}/deck-images/${deckSlug}/page-${i + 1}.jpg`;
      
      const { error: uploadError } = await supabaseClient.storage
        .from('decks')
        .upload(imagePath, imageBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw new Error(`Upload error at page ${i+1}: ${uploadError.message}`);

      const { data: urlData } = supabaseClient.storage.from('decks').getPublicUrl(imagePath);
      imageUrls.push({ image_url: urlData.publicUrl, page_number: i + 1 });
    }

    console.log(`[Step 5] Finalizing database update...`);
    // Update the deck record
    const { error: dbError } = await supabaseClient
      .from('decks')
      .update({ 
        pages: imageUrls, 
        status: 'PROCESSED' 
      })
      .eq('id', deck.id);

    if (dbError) throw new Error(`Final update error: ${dbError.message}`);

    console.log('--- Function Successful ---');
    return new Response(JSON.stringify({ 
      success: true, 
      count: imageUrls.length,
      message: 'Processing completed'
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 200
    });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[CRITICAL ERROR] ${errorMessage}`);
    
    return new Response(JSON.stringify({ 
      error: true,
      message: errorMessage 
    }), {
      status: 200, // Return 200 so the frontend can read the JSON error message
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});
