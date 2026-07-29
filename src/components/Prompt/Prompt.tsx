import "./Prompt.css";

interface PromptProps{

    onSelect:(prompt:string)=>void;

}

const prompts=[

    "Ultra realistic portrait, 8k, masterpiece",

    "Anime style, best quality, masterpiece",

    "Cinematic photography, dramatic lighting",

    "Fantasy landscape, ultra detailed",

    "Luxury product photo, studio lighting"

];

export default function Prompt({

    onSelect

}:PromptProps){

    return(

        <div className="prompt-panel">

            <div className="prompt-header">

                Prompt Library

            </div>

            <div className="prompt-search">

                <input

                    placeholder="Search..."

                />

            </div>

            <div className="prompt-list">

                {prompts.map((prompt,index)=>(

                    <div

                        key={index}

                        className="prompt-item"

                        onClick={()=>onSelect(prompt)}

                    >

                        {prompt}

                    </div>

                ))}

            </div>

        </div>

    );

}