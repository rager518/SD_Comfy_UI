import settings from "@/stores/imageStore";
import * as querystring from "querystring"

let serverAddress = process.env.NEXT_PUBLIC_SERVER_ADDRESS;
let clientId = process.env.NEXT_PUBLIC_Client_ID ?? "5b583e29902046249c2ac9c2d1480997";

interface QueuePromptResponse {
    prompt_id: string;
}

class UploadImageResponse {
    name: string;
    url: string;

    constructor(name: string, url: string) {
        this.name = name;
        this.url = url;
    }
}

interface ImageResponse {
    name: string;
    subfolder: string;
    type: string;
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


async function uploadImage(file: File): Promise<UploadImageResponse> {
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch(`http://${serverAddress}/api/upload/image`, {
        method: 'POST',
        body: formData
    });

    const data = (await response.json()) as ImageResponse;

    let url = getImage(data.name, data.subfolder, data.type);
    return new UploadImageResponse(data.name, url);
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

    // const prompt2 = `
    // {
    //     "3": {
    //         "inputs": {
    //             "seed": 1111666839421029,
    //             "steps": 20,
    //             "cfg": 8,
    //             "sampler_name": "euler",
    //             "scheduler": "normal",
    //             "denoise": 1,
    //             "model": ["4", 0],
    //             "positive": ["6", 0],
    //             "negative": ["7", 0],
    //             "latent_image": ["5", 0]
    //         },
    //         "class_type": "KSampler"
    //     },
    //     "4": {
    //         "inputs": {
    //             "ckpt_name": "onlyrealistic_v30BakedVAE.safetensors"
    //         },
    //         "class_type": "CheckpointLoaderSimple"
    //     },
    //     "5": {
    //         "inputs": {
    //             "width": 512,
    //             "height": 512,
    //             "batch_size": 1
    //         },
    //         "class_type": "EmptyLatentImage"
    //     },
    //     "6": {
    //         "inputs": {
    //             "text": "一个女孩，黄色裙子",
    //             "speak_and_recognation": true,
    //             "clip": ["4", 1]
    //         },
    //         "class_type": "CLIPTextEncode"
    //     },
    //     "7": {
    //         "inputs": {
    //             "text": "text, watermark，sex",
    //             "speak_and_recognation": true,
    //             "clip": ["4", 1]
    //         },
    //         "class_type": "CLIPTextEncode"
    //     },
    //     "8": {
    //         "inputs": {
    //             "samples": ["3", 0],
    //             "vae": ["4", 2]
    //         },
    //         "class_type": "VAEDecode"
    //     },
    //     "11": {
    //         "inputs": {
    //             "images": ["8", 0]
    //         },
    //         "class_type": "PreviewImage"
    //     }
    // }
    // `;
    // const p2 = JSON.parse(prompt2);
    // p2["3"]["inputs"]["seed"] = Date.now();
    // p2["6"]["inputs"]["text"] = clip;


    // const prompt = `
    // {
    //     "1": {
    //         "inputs": {
    //             "unet_name": "F.1基础算法模型-哩布在线可运行_F.1-dev-fp8.safetensors",
    //             "weight_dtype": "fp8_e4m3fn"
    //         },
    //         "class_type": "UNETLoader"
    //     },
    //     "2": {
    //         "inputs": {
    //             "clip_name1": "t5xxl_fp8_e4m3fn.safetensors",
    //             "clip_name2": "clip_l.safetensors",
    //             "type": "flux"
    //         },
    //         "class_type": "DualCLIPLoader"
    //     },
    //     "3": {
    //         "inputs": {
    //             "vae_name": "ae.sft"
    //         },
    //         "class_type": "VAELoader"
    //     },
    //     "4": {
    //         "inputs": {
    //             "seed": 467802083945155,
    //             "steps": 30,
    //             "cfg": 1,
    //             "sampler_name": "uni_pc_bh2",
    //             "scheduler": "beta",
    //             "denoise": 0.88,
    //             "model": ["38", 0],
    //             "positive": ["15", 0],
    //             "negative": ["15", 1],
    //             "latent_image": ["15", 2]
    //         },
    //         "class_type": "KSampler"
    //     },
    //     "5": {
    //         "inputs": {
    //             "clip_l": ["6", 0],
    //             "t5xxl": ["6", 0],
    //             "guidance": 3.5,
    //             "speak_and_recognation": true,
    //             "clip": ["30", 1]
    //         },
    //         "class_type": "CLIPTextEncodeFlux"
    //     },
    //     "6": {
    //         "inputs": {
    //             "Text": "Bruising, Blood stains,face_bruising,Serious injury,apply realistic dark bruising around the eye area and subtle purple bruises under the eyes,",
    //             "speak_and_recognation": true
    //         },
    //         "class_type": "DF_Text_Box"
    //     },
    //     "7": {
    //         "inputs": {
    //             "conditioning": ["5", 0]
    //         },
    //         "class_type": "ConditioningZeroOut"
    //     },
    //     "8": {
    //         "inputs": {
    //             "context_expand_pixels": 20,
    //             "context_expand_factor": 1,
    //             "fill_mask_holes": true,
    //             "blur_mask_pixels": 16,
    //             "invert_mask": false,
    //             "blend_pixels": 16,
    //             "rescale_algorithm": "bicubic",
    //             "mode": "ranged size",
    //             "force_width": 1024,
    //             "force_height": 1024,
    //             "rescale_factor": 1,
    //             "min_width": 768,
    //             "min_height": 768,
    //             "max_width": 1024,
    //             "max_height": 1024,
    //             "padding": 32,
    //             "image": ["9", 0],
    //             "mask": ["9", 1],
    //             "optional_context_mask": ["9", 2]
    //         },
    //         "class_type": "InpaintCrop"
    //     },
    //     "9": {
    //         "inputs": {
    //             "rescale_algorithm": "bicubic",
    //             "mode": "ensure minimum size",
    //             "min_width": 1024,
    //             "min_height": 1024,
    //             "rescale_factor": 1,
    //             "image": ["10", 0],
    //             "mask": ["10", 1],
    //             "optional_context_mask": ["19", 1]
    //         },
    //         "class_type": "InpaintResize"
    //     },
    //     "10": {
    //         "inputs": {
    //             "image": "clipspace/clipspace-mask-1207589.0999999999.png [input]",
    //             "upload": "image"
    //         },
    //         "class_type": "LoadImage"
    //     },
    //     "15": {
    //         "inputs": {
    //             "positive": ["5", 0],
    //             "negative": ["7", 0],
    //             "vae": ["30", 2],
    //             "pixels": ["8", 1],
    //             "mask": ["8", 2]
    //         },
    //         "class_type": "InpaintModelConditioning"
    //     },
    //     "16": {
    //         "inputs": {
    //             "samples": ["4", 0],
    //             "vae": ["30", 2]
    //         },
    //         "class_type": "VAEDecode"
    //     },
    //     "17": {
    //         "inputs": {
    //             "rescale_algorithm": "bislerp",
    //             "stitch": ["8", 0],
    //             "inpainted_image": ["16", 0]
    //         },
    //         "class_type": "InpaintStitch"
    //     },
    //     "19": {
    //         "inputs": {
    //             "image": "clipspace/clipspace-mask-1216252.5999999999.png [input]",
    //             "upload": "image"
    //         },
    //         "class_type": "LoadImage"
    //     },
    //     "30": {
    //         "inputs": {
    //             "ckpt_name": "flux1-dev-bnb-nf4-v2.safetensors"
    //         },
    //         "class_type": "CheckpointLoaderNF4"
    //     },
    //     "35": {
    //         "inputs": {
    //             "rgthree_comparer": {
    //                 "images": []
    //             }
    //         },
    //         "class_type": "Image Comparer (rgthree)"
    //     },
    //     "38": {
    //         "inputs": {
    //             "lora_name": "bruising-100.safetensors",
    //             "strength_model": 1.5,
    //             "model": ["1", 0]
    //         },
    //         "class_type": "LoraLoaderModelOnly"
    //     },
    //     "39": {
    //         "inputs": {
    //             "images": ["17", 0]
    //         },
    //         "class_type": "PreviewImage"
    //     }
    // }
    // `;
    // const p = JSON.parse(prompt);
    // p["4"]["inputs"]["seed"] = Date.now();
    // p["6"]["inputs"]["text"] = clip;


    // 眼部淤青
   
    const prompt3 = `
    {
        "1": {
            "inputs": {
                "unet_name": "F.1基础算法模型-哩布在线可运行_F.1-dev-fp8.safetensors",
                "weight_dtype": "fp8_e4m3fn"
            },
            "class_type": "UNETLoader"
        },
        "2": {
            "inputs": {
                "clip_name1": "t5xxl_fp8_e4m3fn.safetensors",
                "clip_name2": "clip_l.safetensors",
                "type": "flux"
            },
            "class_type": "DualCLIPLoader"
        },
        "3": {
            "inputs": {
                "vae_name": "ae.sft"
            },
            "class_type": "VAELoader"
        },
        "4": {
            "inputs": {
                "seed": 683448518644628,
                "steps": 30,
                "cfg": 1,
                "sampler_name": "uni_pc_bh2",
                "scheduler": "beta",
                "denoise": 0.88,
                "model": ["38", 0],
                "positive": ["15", 0],
                "negative": ["15", 1],
                "latent_image": ["15", 2]
            },
            "class_type": "KSampler"
        },
        "5": {
            "inputs": {
                "clip_l": ["6", 0],
                "t5xxl": ["6", 0],
                "guidance": 3.5,
                "speak_and_recognation": true,
                "clip": ["30", 1]
            },
            "class_type": "CLIPTextEncodeFlux"
        },
        "6": {
            "inputs": {
                "Text": "Bruising,Bruise,eyes_around_bruising,Serious injury,",
                "speak_and_recognation": true
            },
            "class_type": "DF_Text_Box"
        },
        "7": {
            "inputs": {
                "conditioning": ["5", 0]
            },
            "class_type": "ConditioningZeroOut"
        },
        "8": {
            "inputs": {
                "context_expand_pixels": 20,
                "context_expand_factor": 1,
                "fill_mask_holes": true,
                "blur_mask_pixels": 16,
                "invert_mask": false,
                "blend_pixels": 16,
                "rescale_algorithm": "bicubic",
                "mode": "ranged size",
                "force_width": 1024,
                "force_height": 1024,
                "rescale_factor": 1,
                "min_width": 768,
                "min_height": 768,
                "max_width": 1024,
                "max_height": 1024,
                "padding": 32,
                "image": ["9", 0],
                "mask": ["9", 1],
                "optional_context_mask": ["9", 2]
            },
            "class_type": "InpaintCrop"
        },
        "9": {
            "inputs": {
                "rescale_algorithm": "bicubic",
                "mode": "ensure minimum size",
                "min_width": 1024,
                "min_height": 1024,
                "rescale_factor": 1,
                "image": ["10", 0],
                "mask": ["10", 1],
                "optional_context_mask": ["40", 1]
            },
            "class_type": "InpaintResize"
        },
        "10": {
            "inputs": {
                "image": "原图1.jpg",
                "upload": "image"
            },
            "class_type": "LoadImage"
        },
        "15": {
            "inputs": {
                "positive": ["5", 0],
                "negative": ["7", 0],
                "vae": ["30", 2],
                "pixels": ["8", 1],
                "mask": ["8", 2]
            },
            "class_type": "InpaintModelConditioning"
        },
        "16": {
            "inputs": {
                "samples": ["4", 0],
                "vae": ["30", 2]
            },
            "class_type": "VAEDecode"
        },
        "17": {
            "inputs": {
                "rescale_algorithm": "bislerp",
                "stitch": ["8", 0],
                "inpainted_image": ["16", 0]
            },
            "class_type": "InpaintStitch"
        },
        "30": {
            "inputs": {
                "ckpt_name": "flux1-dev-bnb-nf4-v2.safetensors"
            },
            "class_type": "CheckpointLoaderNF4"
        },
        "35": {
            "inputs": {
                "rgthree_comparer": {
                    "images": []
                }
            },
            "class_type": "Image Comparer (rgthree)"
        },
        "38": {
            "inputs": {
                "lora_name": "bruising-100.safetensors",
                "strength_model": 1.5,
                "model": ["1", 0]
            },
            "class_type": "LoraLoaderModelOnly"
        },
        "39": {
            "inputs": {
                "images": ["17", 0]
            },
            "class_type": "PreviewImage"
        },
        "40": {
            "inputs": {
                "face": true,
                "hair": false,
                "body": false,
                "clothes": false,
                "accessories": false,
                "background": false,
                "confidence": 0.4,
                "detail_range": 16,
                "black_point": 0.01,
                "white_point": 0.99,
                "process_detail": true,
                "images": ["10", 0]
            },
            "class_type": "LayerMask: PersonMaskUltra"
        }
    }
    `;
    

    const p3 = JSON.parse(prompt3);
    
    let name = settings.getItem().name;
    p3["4"]["inputs"]["seed"] = Date.now();
    p3["6"]["inputs"]["text"] = clip;
    p3["10"]["inputs"]["image"] = name;


    await getImages(ws, p3);
}

const AIReturn = {
    src: ""
}

export { generateAI, AIReturn, uploadImage };  