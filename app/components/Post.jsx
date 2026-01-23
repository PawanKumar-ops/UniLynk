import React from 'react'
import "./Post.css"

const Post = ({ setIspost }) => {
  return (
    <div className='postbody'>
        
    <button className='back' onClick={(e)=> {setIspost(false)}} >
        <img src="./Post/backarrow.svg" alt="back arrow" />
    </button>
      
    </div>
  )
}

export default Post
