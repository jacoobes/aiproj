import { loadModel } from 'gpt4all'

export class Embedder { 
    __embedder;
    async init() {
       this.__embedder = await loadModel({ type: 'embedding'
       }) 

    }
}
