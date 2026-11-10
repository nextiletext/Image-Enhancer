export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Convert Base64 back to binary buffer for Hugging Face
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Call Hugging Face's Real-ESRGAN AI Model
    const response = await fetch(
      "https://api-inference.huggingface.co/models/xinntao/Real-ESRGAN",
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_TOKEN}`,
          "Content-Type": "application/octet-stream",
        },
        method: "POST",
        body: buffer,
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return res.status(500).json({ error: `AI model error: ${errText}` });
    }

    // Get the upscaled image bytes and convert back to Base64 to send to front-end
    const arrayBuffer = await response.arrayBuffer();
    const resultBase64 = Buffer.from(arrayBuffer).toString('base64');
    
    return res.status(200).json({ 
      upscaledImage: `data:image/png;base64,${resultBase64}` 
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
