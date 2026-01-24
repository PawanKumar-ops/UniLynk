"use client"

import React from 'react'
import "./Post.css"

const Post = ({ setIspost }) => {

    const handleAutoGrow = (e) => {
        const el = e.target;
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
    };


    return (
        <div className='postbody'>

            <button className='back' onClick={(e) => { setIspost(false) }} >
                <img src="/Postimg/cross.svg" alt="Close" />
            </button>

            <textarea className='postbar'
                rows={1}
                onInput={handleAutoGrow}
            />
            <hr className='mt-2 mb-4' />

            <div className="postfoot">
            <div className="posttools">

                <button className='mediaicon'><img src="./Postimg/media.svg" alt="" /></button>
                <button className='emojiicon'><img src="./Postimg/emoji.svg" alt="" /></button>
                <button className='gificon'><img src="./Postimg/gif.svg" alt="" /></button>
                <button className='pollicon'><img src="./Postimg/poll.svg" alt="" /></button>

            </div>

            <button>
            <div className="posttext">Post</div>
            </button>
            
            </div>
        </div>
    )
}

export default Post
