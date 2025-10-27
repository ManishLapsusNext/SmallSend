// --- FIX 1: Using "bare specifiers" from deno.json ---
import { createClient } from '@supabase/supabase-js'
import { serve } from 'std/http'

// --- FIX 2 & 3: Removed 'async' and prefixed unused variable with '_' ---
function convertPdfToImages(_pdfBuffer: ArrayBuffer): Promise<ArrayBuffer[]> {
  console.log('Pretending to convert PDF to images...');
  // This is a Promise-based function, so we return a resolved Promise.
  return Promise.resolve([]);
}


serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
  }
  
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { record } = await req.json();
    const { name: filePath, bucket_id: bucketName } = record;

    if (!filePath.startsWith('decks/')) {
      return new Response(JSON.stringify({ message: 'Not a deck file, skipping.' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data: fileData, error: downloadError } = await supabaseClient
      .storage
      .from(bucketName)
      .download(filePath);

    if (downloadError) throw downloadError;
    console.log(`Successfully downloaded ${filePath}`);

    const pdfBuffer = await fileData.arrayBuffer();
    // We now call the function without await as it's no longer async
    const imageBuffers = await convertPdfToImages(pdfBuffer);
    
    if (imageBuffers.length === 0) {
      console.warn("Conversion resulted in 0 images. Aborting.");
      return new Response(JSON.stringify({ message: "Conversion failed or produced no images." }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const imageUrls = [];
    const fileBaseName = filePath.split('/').pop()?.replace('.pdf', '');
    const deckId = fileBaseName;

    for (let i = 0; i < imageBuffers.length; i++) {
      const imagePath = `deck-images/${deckId}/page-${i + 1}.png`;
      
      const { error: uploadError } = await supabaseClient.storage
        .from('decks')
        .upload(imagePath, imageBuffers[i], {
          contentType: 'image/png',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabaseClient.storage.from('decks').getPublicUrl(imagePath);
      imageUrls.push(urlData.publicUrl);
    }
    console.log(`Successfully uploaded ${imageUrls.length} images.`);

    const { error: dbError } = await supabaseClient
      .from('decks')
      .update({ pages: imageUrls, status: 'PROCESSED' })
      .eq('slug', deckId);

    if (dbError) throw dbError;
    console.log(`Successfully updated deck ${deckId} in the database.`);

    return new Response(JSON.stringify({ imageUrls }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (error) {
    console.error(error);
    const err = error as Error;
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});