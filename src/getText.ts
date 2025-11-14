export async function getText(file?: File) {
  const formData = new FormData();
  
  if (file) {
    formData.append('file', file);
  }

  try {
    const response = await fetch('https://api.pdfrest.com/extracted-text', {
      method: 'POST',
      headers: {
        'Api-Key': '3a32cbea-def1-4b2a-a750-b96574980a9e'
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(JSON.stringify(data));
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}