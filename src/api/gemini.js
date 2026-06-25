export const gradeWritingTask1Api = async (text, apiKey) => {
    const systemPrompt = `As an expert IELTS examiner, evaluate the following Academic Writing Task 1 response. Provide your feedback as a single JSON object. Do not include any text, markdown, or comments outside of the JSON object. The JSON object must have the following structure:
    {
      "scores": {
        "TaskAchievement": { "score": 7.0, "observation": "A detailed explanation for this score, highlighting specific examples from the text that justify the band score. Mention strengths and areas for improvement." },
        "CoherenceAndCohesion": { "score": 6.5, "observation": "A detailed explanation for this score, highlighting specific examples from the text that justify the band score. Mention strengths and areas for improvement." },
        "LexicalResource": { "score": 6.0, "observation": "A detailed explanation for this score, highlighting specific examples from the text that justify the band score. Mention strengths and areas for improvement." },
        "GrammaticalRangeAndAccuracy": { "score": 7.5, "observation": "A detailed explanation for this score, highlighting specific examples from the text that justify the band score. Mention strengths and areas for improvement." }
      },
      "correctedHtml": "<string>"
    }
    For the 'correctedHtml' string, use the user's original essay. For each error, wrap the incorrect word/phrase in a <del> tag. Inside this tag, after the incorrect word, insert the correction inside a <span class='handwritten'> tag. Example: 'This is a <del>good<span class='handwritten'>great</span></del> idea.' Ensure the entire output is a valid JSON object starting with { and ending with }.`;

    const userQuery = `My essay is:\n---\n${text}\n---`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error('Grading API request failed.');

    const result = await response.json();
    let responseText = result.candidates[0].content.parts[0].text;

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) responseText = jsonMatch[0];

    return JSON.parse(responseText);
};

export const gradeWritingTask2Api = async (text, essayQuestion, apiKey) => {
    const systemPrompt = `As an expert IELTS examiner, evaluate the following Academic Writing Task 2 essay. The essay question was: "${essayQuestion}". Provide your feedback as a single JSON object without any external text or markdown. The JSON object must have this structure:
    {
      "scores": {
        "TaskResponse": { "score": 7.0, "observation": "Detailed explanation for this score, assessing how well the writer addressed all parts of the task. Mention strengths and areas for improvement." },
        "CoherenceAndCohesion": { "score": 6.5, "observation": "Detailed explanation for this score, focusing on paragraphing, logical flow, and use of cohesive devices. Mention strengths and areas for improvement." },
        "LexicalResource": { "score": 6.0, "observation": "Detailed explanation for this score, analyzing the range and accuracy of vocabulary. Mention strengths and areas for improvement." },
        "GrammaticalRangeAndAccuracy": { "score": 7.5, "observation": "Detailed explanation for this score, assessing the range and accuracy of grammatical structures. Mention strengths and areas for improvement." }
      },
      "correctedHtml": "<string>"
    }
    For 'correctedHtml', use the user's original essay. For each error, wrap the incorrect word/phrase in a <del> tag and insert the correction inside a <span class='handwritten'> tag within the <del> tag. Example: 'This is a <del>good<span class='handwritten'>great</span></del> idea.' Ensure the entire output is a valid JSON object.`;

    const userQuery = `My essay for the question "${essayQuestion}" is:\n---\n${text}\n---`;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error('Grading API request failed.');

    const result = await response.json();
    let responseText = result.candidates[0].content.parts[0].text;

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) responseText = jsonMatch[0];

    return JSON.parse(responseText);
};

export const generateGraphTaskApi = async (apiKey) => {
    const prompts = [
        "A simple line graph for an IELTS writing task 1, showing changes in population in 3 different countries between 1990 and 2020.",
        "An IELTS academic writing task 1 bar chart comparing the percentage of households with different types of pets in the UK in 2010 and 2020.",
        "A pie chart for IELTS writing task 1 illustrating the main sources of electricity in a European country in 2023.",
    ];
    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: randomPrompt }] }],
            generationConfig: { responseModalities: ["IMAGE", "TEXT"] }
        })
    });

    if (!response.ok) throw new Error(`API error: ${response.statusText}`);

    const result = await response.json();
    const imagePart = result?.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (imagePart?.inlineData) {
        return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    } else {
        throw new Error("Invalid response structure from image generation API.");
    }
};
