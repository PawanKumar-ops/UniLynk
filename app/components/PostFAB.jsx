"use client"

import React from 'react'
import "./PostFAB.css"
import { useState } from 'react'

const PostFAB = ({ setIspost }) => {


    return (
        <div>
            <button className="fab" onClick={(e) => { setIspost(true); }}>
                <span className="plus">+</span>
                <div className="fabtextcont">
                    <span className="text">POST</span>
                </div>
            </button>
        </div>
    )
}

export default PostFAB
