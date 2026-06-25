export const generateListeningTestPartApi = async (part, apiKey) => {
    const partDetails = {
        1: { instructions: "a conversation between two speakers in an everyday social context (e.g., an inquiry about a service). Questions are typically form/note/table completion.", startQ: 1 },
        2: { instructions: "a monologue in an everyday social context (e.g., a speech about local facilities). Questions can be multiple choice or map/plan labeling.", startQ: 11 },
        3: { instructions: "a conversation between up to three people in an educational or training context (e.g., university students and a tutor). Questions are often multiple choice or matching.", startQ: 21 },
        4: { instructions: "a monologue on an academic subject (e.g., a university lecture). Questions are typically note completion.", startQ: 31 },
    }
    const { instructions, startQ } = partDetails[part];

    const systemPrompt = `You are an expert IELTS test creator. Your task is to generate one part of an IELTS Listening test based on the provided part number. The output must be a single, valid JSON object with no external text, comments, or markdown.

The JSON object must have the following structure:
{
  "script": "The full audio script for the section...",
  "speakers": [ { "name": "SpeakerName", "voice": "VoiceName" }, ... ],
  "instructions": "The instructions for this part, e.g., 'Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer.'",
  "questions": [
    { "q": "QuestionNumber", "type": "text/mcq", "label": "The question text with a blank represented by '____' for fill-in-the-blank questions...", "options": ["A) ...", "B) ...", "C) ..."], "answer": "The correct answer..." },
    ...
  ]
}

Guidelines for this part:
- **Part ${part}:** This part is ${instructions}.
- **General:**
  - Generate exactly 10 questions, numbered sequentially from ${startQ} to ${startQ + 9}.
  - For 'text' type questions, the 'label' must contain the sentence with a blank represented by '____', e.g., "The manager's name is ____.". The answer is the word(s) that fill the blank.
  - For 'mcq' type questions, provide 3 options and the correct answer should be the letter (e.g., "A", "B", or "C").
  - The script must contain the answers to all questions clearly.
  - 'speakers' array: For monologues, use one speaker. For conversations, use two or three. Assign a valid voice from this list: Charon, Leda, Puck, Kore, Fenrir, Zephyr, Orus.
  - Ensure the script is natural-sounding and appropriate for an IELTS test.
  - Word Count: Strictly enforce word limits in answers. If instructions say "ONE WORD ONLY", the 'answer' field must contain only one word. If "NO MORE THAN TWO WORDS", the answer can be one or two words.
`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const payload = {
        contents: [{ parts: [{ text: "Generate the test part." }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error('Test generation API request failed.');

    const result = await response.json();
    let responseText = result.candidates[0].content.parts[0].text;

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) responseText = jsonMatch[0];

    return JSON.parse(responseText);
};

export const generateListeningAudioApi = async (script, speakers, apiKey) => {
    let processedScript = script;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;

    const speechConfig = {};
    let uniqueSpeakers = [...new Map(speakers.map(item => [item.name, item])).values()];

    const textForTTS = `Say the following script with natural pauses between each speaker's lines to allow the listener to follow along. \n\n ${processedScript}`;

    if (uniqueSpeakers.length > 1) {
        if(uniqueSpeakers.length > 2) uniqueSpeakers = uniqueSpeakers.slice(0,2);
        speechConfig.multiSpeakerVoiceConfig = {
            speakerVoiceConfigs: uniqueSpeakers.map(s => ({
                speaker: s.name,
                voiceConfig: { prebuiltVoiceConfig: { voiceName: s.voice } }
            }))
        };
    } else if (uniqueSpeakers.length === 1) {
        speechConfig.voiceConfig = {
            prebuiltVoiceConfig: { voiceName: uniqueSpeakers[0].voice }
        };
    }

    const payload = {
        contents: [{ parts: [{ text: textForTTS }] }],
        generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: speechConfig
        },
        model: "gemini-2.5-flash-preview-tts"
    };

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("Audio generation API error:", response.status, errorBody);
        throw new Error('Failed to generate audio.');
    }

    const result = await response.json();
    const audioData = result?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) throw new Error('No audio data received.');

    // Convertir PCM a WAV
    const pcmData = atob(audioData).split('').map(c => c.charCodeAt(0));
    const pcm16 = new Int16Array(new Uint8Array(pcmData).buffer);

    const header = new ArrayBuffer(44);
    const view = new DataView(header);
    const sampleRate = 24000; const channels = 1; const bitsPerSample = 16;

    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + pcm16.byteLength, true);
    view.setUint32(8, 0x57415645, false); // "WAVE"
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * channels * (bitsPerSample / 8), true);
    view.setUint16(32, channels * (bitsPerSample / 8), true);
    view.setUint16(34, bitsPerSample, true);
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, pcm16.byteLength, true);

    const wavBlob = new Blob([view, pcm16], { type: 'audio/wav' });
    return URL.createObjectURL(wavBlob);
};
