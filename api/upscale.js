export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Increase payload limit for larger images
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

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

    const contentType = response.headers.get("content-type");

    // If Hugging Face returns an error JSON instead of an image
    if (!response.ok || (contentType && contentType.includes("application/json"))) {
      const errText = await response.text();
      return res.status(500).json({ error: `AI Model Error: ${errText}` });
    }

    const arrayBuffer = await response.arrayBuffer();
    const resultBase64 = Buffer.from(arrayBuffer).toString('base64');
    
    return res.status(200).json({ 
      upscaledImage: `data:image/png;base64,${resultBase64}` 
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
