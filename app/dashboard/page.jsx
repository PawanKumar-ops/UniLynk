"use client"

import React from 'react'
import "./dashboard.css"
import { useState } from 'react';




const dashboard = () => {
  const [isAnnual, setIsAnnual] = useState(true);
  return (
    <>
      <div className="homebody">
        <header>
          <div className="menu">
            <div className="logo">
              <img src="ULynk.svg" alt="" />
            </div>
            <div className="dashboard">
              <button className="dashbutton">
                <img src="./dashboard/Home.svg" alt="" />
                Home</button>
              <button className="dashbutton">
                <img src="./dashboard/MyClubs.svg" alt="" />
                My Clubs</button>
              <button className="dashbutton">
                <img src="./dashboard/Events.svg" alt="" />
                Events</button>
              <button className="dashbutton gethelp">
                <img src="./dashboard/GetHelp.svg" alt="" />
                Get Help</button>
              <div className="profile">
                <div className="profback">
                  <img src="Background.jpg" alt="" />
                </div>
                <div className="profpic">
                  <img src="Profilepic.png" alt="" />
                </div>
                <div className="profinfo">
                  <h2 className="username">Pawan Kumar</h2>
                  <div className="branch">Production and Industrial Engineering</div>
                  <div className="year">1st Year</div>
                </div>
                <div className="post">
                  <button>POST</button>
                </div>
              </div>
            </div>
          </div>
        </header>
        <main>



          <div className="feed">
            <div className="fhead">

              <div className="pricing-toggle">
                <div className={`toggle-track ${!isAnnual ? "right" : ""}`}>
                  <div className="toggle-bg"></div>

                  <button
                    className={`toggle-btn ${isAnnual ? "active" : ""}`}
                    onClick={() => setIsAnnual(true)}
                  >
                    For You
                  </button>

                  <button
                    className={`toggle-btn ${!isAnnual ? "active" : ""}`}
                    onClick={() => setIsAnnual(false)}
                  >
                    Clubs
                  </button>
                </div>
              </div>

            </div>
          </div>




          <div className="msgsidebar">
            <div className="msgsidebarmain">
              <div className="msgsearchbar">
                <img className='searchicon' src="./dashboard/Search.svg" alt="" />
                <input className='searchinput' placeholder='Search' type="text" />
              </div>
              <hr className='mt-4' />
              <div className="msgbuttons">
                <button className='msgbutton'>
                  <img src="./Chat/Recent.svg" alt="" />
                  Recent</button>
                <button className='msgbutton'>
                  <img src="./Chat/Chats.svg" alt="" />
                  Chats</button>
                <button className='msgbutton'>
                  <img src="./Chat/Clubs.svg" alt="" />
                  Clubs</button>
              </div>
              <hr className='mt-4 mb-4' />

              <div className="chat">
                <div className="chatheader">
                  <div className="clublogo">
                    <img src="NITLOGO.webp" alt="" />
                  </div>
                  <div className="clubname">Innovation Cell</div>
                </div>
                <div className="allchats">
                  <div className="userchat"></div>
                  <div className="userchat"></div>
                  <div className="userchat"></div>
                  <div className="userchat"></div>
                  <div className="userchat"></div>
                  <div className="userchat"></div>
                  <div className="userchat"></div>
                  <div className="userchat"></div>
                  <div className="userchat"></div>
                  <div className="userchat"></div>
                  <div className="userchat"></div>
                  <div className="userchat"></div>
                  <div className="userchat"></div>
                  <div className="userchat"></div>
                  <div className="userchat"></div>
                  <div className="userchat"></div>
                  <div className="userchat"></div>
                  <div className="userchat"></div>
                  <div className="userchat"></div>
                  <div className="userchat"></div>
                  <div className="userchat"></div>
                  <div className="userchat"></div>
                  <div className="userchat"></div>
                  <div className="userchat"></div>
                  <div className="userchat"></div>
                  <div className="userchat"></div>
                  <div className="userchat"></div>
                  <div className="userchat"></div>
                  <div className="userchat"></div>
                  <div className="userchat"></div>
                  <div className="userchat"></div>
                </div>
              </div>



            </div>
          </div>
        </main>
      </div>
    </>
  )
}

export default dashboard
