import * as querystring from "querystring"

let serverAddress = "192.168.31.145:8188";
const clientId: string = "5b583e29902046249c2ac9c2d1480997";

interface QueuePromptResponse {
    prompt_id: string;
}

interface GetHistoryResponse {
    [key: string]: {
        outputs: {
            [nodeId: string]: {
                images?: Array<{ filename: string, subfolder: string, type: string }>;
            }
        }
    }
}

async function queuePrompt(prompt: string): Promise<QueuePromptResponse> {
    const p = { prompt, client_id: clientId };
    const response = await fetch(`http://${serverAddress}/prompt`, {
        method: 'POST',
        body: JSON.stringify(p)
    });

    const data = (await response.json()) as QueuePromptResponse;

    pid = data.prompt_id;

    return data;
}

function getImage(filename: string, subfolder: string, folderType: string): string {
    const data = { filename, subfolder, type: folderType };
    const urlValues = querystring.stringify(data);
    return `http://${serverAddress}/view?${urlValues}`;
}

async function getHistory(prompt_id: string): Promise<GetHistoryResponse> {
    const response = await fetch(`http://${serverAddress}/history/${prompt_id}`);

    const data = (await response.json()) as GetHistoryResponse;
    return data;
}

var pid: string = "";

async function getImages(ws: WebSocket, prompt: string) {
    await queuePrompt(prompt);
}

async function generateAI(url: string, clip: string) {
    serverAddress = url ?? serverAddress;
    const ws = new WebSocket(`ws://${serverAddress}/ws?clientId=${clientId}`);

    ws.onmessage = async (event) => {
        const out = event.data;
        if (typeof out === 'string') {
            const message = JSON.parse(out);
            if (message.type === 'executing') {
                const data = message.data;
                if (data.node === null && data.prompt_id === pid) {
                    const outputImages: { [key: string]: string[] } = {};
                    const history = await getHistory(pid);
                    const promptHistory = history[pid];

                    for (const nodeId in promptHistory.outputs) {
                        const nodeOutput = promptHistory.outputs[nodeId];
                        const imagesOutput: string[] = [];
                        if (nodeOutput.images) {
                            for (const image of nodeOutput.images) {
                                const imageData = getImage(image.filename, image.subfolder, image.type);
                                imagesOutput.push(imageData);
                            }
                        }
                        outputImages[nodeId] = imagesOutput;
                        AIReturn.src = imagesOutput[0];
                    }
                }
            }
        } else {
            return;
        }
    };

    const prompt = `
    {
        "3": {
            "inputs": {
                "seed": 1111666839421029,
                "steps": 20,
                "cfg": 8,
                "sampler_name": "euler",
                "scheduler": "normal",
                "denoise": 1,
                "model": ["4", 0],
                "positive": ["6", 0],
                "negative": ["7", 0],
                "latent_image": ["5", 0]
            },
            "class_type": "KSampler"
        },
        "4": {
            "inputs": {
                "ckpt_name": "onlyrealistic_v30BakedVAE.safetensors"
            },
            "class_type": "CheckpointLoaderSimple"
        },
        "5": {
            "inputs": {
                "width": 512,
                "height": 512,
                "batch_size": 1
            },
            "class_type": "EmptyLatentImage"
        },
        "6": {
            "inputs": {
                "text": "一个女孩，黄色裙子",
                "speak_and_recognation": true,
                "clip": ["4", 1]
            },
            "class_type": "CLIPTextEncode"
        },
        "7": {
            "inputs": {
                "text": "text, watermark，sex",
                "speak_and_recognation": true,
                "clip": ["4", 1]
            },
            "class_type": "CLIPTextEncode"
        },
        "8": {
            "inputs": {
                "samples": ["3", 0],
                "vae": ["4", 2]
            },
            "class_type": "VAEDecode"
        },
        "11": {
            "inputs": {
                "images": ["8", 0]
            },
            "class_type": "PreviewImage"
        }
    }
    `;
    const p = JSON.parse(prompt);
    p["3"]["inputs"]["seed"] = Date.now();
    p["6"]["inputs"]["text"] = clip;

    await getImages(ws, p);
}

const AIReturn = {
    src: ""
}

export { generateAI, AIReturn };  