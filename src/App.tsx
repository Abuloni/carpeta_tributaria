import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { getText } from './getText'

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [extractedText, setExtractedText] = useState<string>('')
  const [error, setError] = useState<string>('')

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setSelectedFile(file || null)
    setExtractedText('')
    setError('')
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first')
      return
    }

    setIsLoading(true)
    setError('')
    
    try {
      const result = await getText(selectedFile)
      setExtractedText(result.fullText || 'No text extracted')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract text')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>PDF Text Extractor</h1>
      <div className="card">
        <div className="file-upload">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            disabled={isLoading}
          />
          {selectedFile && (
            <p>Selected: {selectedFile.name}</p>
          )}
          <button 
            onClick={handleUpload} 
            disabled={!selectedFile || isLoading}
          >
            {isLoading ? 'Extracting...' : 'Extract Text'}
          </button>
        </div>
        
        {error && (
          <div className="error">
            <p style={{ color: 'red' }}>Error: {error}</p>
          </div>
        )}
        
        {extractedText && (
          <div className="result">
            <h3>Extracted Text:</h3>
            <textarea 
              value={extractedText} 
              readOnly 
              rows={10}
              style={{ width: '100%', marginTop: '10px' }}
            />
          </div>
        )}
      </div>
      <p className="read-the-docs">
        Upload a PDF file to extract its text content
      </p>
    </>
  )
}

export default App
