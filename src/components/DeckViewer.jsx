import { useState, useEffect, useRef } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { analyticsService } from '../services/analyticsService'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

function DeckViewer({ deck }) {
  const [numPages, setNumPages] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [loading, setLoading] = useState(true)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [viewedPages, setViewedPages] = useState(new Set())
  const pageStartTime = useRef(Date.now())
  const containerRef = useRef(null)

  // Calculate responsive dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth
        const containerHeight = window.innerHeight * 0.75
        
        // Calculate dimensions that fit the container while maintaining aspect ratio
        setDimensions({
          width: Math.min(containerWidth - 40, 1800),
          height: containerHeight
        })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages)
    setLoading(false)
    analyticsService.trackDeckView(deck)
  }

  const goToPrevPage = () => {
    if (pageNumber > 1) {
      trackCurrentPage()
      setPageNumber(pageNumber - 1)
      pageStartTime.current = Date.now()
    }
  }

  const goToNextPage = () => {
    if (pageNumber < numPages) {
      trackCurrentPage()
      setPageNumber(pageNumber + 1)
      pageStartTime.current = Date.now()
    }
  }

  const trackCurrentPage = () => {
    const timeSpent = Math.floor((Date.now() - pageStartTime.current) / 1000)
    analyticsService.trackPageView(deck, pageNumber, timeSpent)
    setViewedPages(prev => new Set([...prev, pageNumber]))
  }

  useEffect(() => {
    if (numPages && viewedPages.size === numPages) {
      analyticsService.trackDeckComplete(deck, numPages)
    }
  }, [viewedPages, numPages, deck])

  useEffect(() => {
    pageStartTime.current = Date.now()
    return () => {
      if (pageNumber) trackCurrentPage()
    }
  }, [pageNumber])

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') goToPrevPage()
      if (e.key === 'ArrowRight') goToNextPage()
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [pageNumber, numPages])

  return (
    <div className="deck-viewer">
      <div className="viewer-header">
        <h1>{deck.title}</h1>
        <div className="page-info">
          Page {pageNumber} of {numPages || '...'}
        </div>
      </div>

      <div className="pdf-container" ref={containerRef}>
        {loading && <div className="pdf-loading">Loading PDF...</div>}
        
        <Document
          file={deck.file_url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div>Loading document...</div>}
          error={<div>Failed to load PDF. Please try again.</div>}
        >
          <Page 
            key={`page_${pageNumber}`}
            pageNumber={pageNumber}
            width={dimensions.width}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
      </div>

      <div className="navigation">
        <button 
          onClick={goToPrevPage} 
          disabled={pageNumber <= 1}
          className="nav-button"
        >
          ← Previous
        </button>
        
        <button 
          onClick={goToNextPage} 
          disabled={pageNumber >= numPages}
          className="nav-button"
        >
          Next →
        </button>
      </div>
    </div>
  )
}

export default DeckViewer