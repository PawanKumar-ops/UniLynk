"use client"

import React, { useState } from 'react';
import './dashboard.css';
import { Search } from 'lucide-react';

export default function Dashboard() {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <div className="homebody">
      <header>
        <div className="menu">
          <div className="logo">
            <img src="/ULynk.svg" alt="ULynk Logo" />
          </div>
          <div className="dashboard">
            <button className="dashbutton">
              <img src="/dashboard/Home.svg" alt="Home icon" />
              Home
            </button>
            <button className="dashbutton">
              <img src="/dashboard/MyClubs.svg" alt="My Clubs icon" />
              My Clubs
            </button>
            <button className="dashbutton">
              <img src="/dashboard/Events.svg" alt="Events icon" />
              Events
            </button>
            <button className="dashbutton gethelp">
              <img src="/dashboard/GetHelp.svg" alt="Get Help icon" />
              Get Help
            </button>
            <div className="profile">
              <div className="profback">
                <img src="/Background.jpg" alt="Profile background" />
              </div>
              <div className="profpic">
                <img src="/Profilepic.png" alt="Profile picture" />
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

          Lorem ipsum dolor sit amet consectetur adipisicing elit. Nihil neque accusantium assumenda voluptas earum error a atque, aliquam quisquam illum impedit debitis dolorem tempore suscipit praesentium facilis. Ab, molestias consequuntur quia delectus magnam minima officiis autem cum ad, totam, minus praesentium? Veniam esse neque dicta quisquam architecto dolores quis cumque, totam enim distinctio ut sit quos sequi, officiis nemo ad vitae deserunt voluptates. Praesentium recusandae cum voluptatibus blanditiis in incidunt, exercitationem labore eos quibusdam possimus ut debitis perspiciatis a, iste accusamus ex dignissimos perferendis vel ipsa fugiat ab eligendi rerum odit! Cum itaque possimus error quae alias quisquam praesentium. Magni cumque minima aut, laboriosam doloribus fuga consequuntur hic pariatur culpa blanditiis, iusto natus excepturi. Sunt, asperiores. Impedit saepe maxime reiciendis laudantium itaque odio enim tempora. Assumenda iusto quis magni, eveniet consequatur numquam aspernatur sequi aut dolor ducimus et placeat rem quos neque amet beatae eius sunt sed, corrupti, voluptas sint veritatis! Alias ut iusto fugit quod architecto ipsa doloribus, deserunt numquam mollitia harum totam ad odit pariatur ipsum optio sunt libero qui, perspiciatis ducimus ratione, aspernatur ab voluptas fuga. Saepe fugit atque, mollitia repellendus officiis sequi quo provident. Error libero est sunt fugiat dolorum excepturi voluptas quisquam et accusantium, voluptatibus ullam iste, explicabo ipsa voluptates! Voluptatibus, quis nemo nam vitae quo, voluptates obcaecati quasi explicabo et minima omnis totam molestias culpa quaerat eligendi autem ratione natus quae praesentium. Incidunt quas sed labore culpa, esse harum mollitia itaque cum aut provident dolore dolor facilis, praesentium minima voluptas totam laboriosam quibusdam nulla rerum adipisci alias quae iste debitis. Eius nihil dolores magnam, reprehenderit delectus minus aliquid culpa iste iure totam dicta iusto. Modi, doloremque? Eos voluptatum similique omnis eum harum a odio, asperiores minima ipsa id recusandae cupiditate adipisci sequi doloribus amet fuga blanditiis temporibus necessitatibus provident dolores voluptates optio accusantium distinctio! Veniam voluptatum quidem ducimus praesentium! Necessitatibus voluptatem incidunt cumque nostrum est perferendis sapiente omnis, non atque beatae aliquid libero enim odio consequuntur quasi ullam officia repudiandae magnam? Accusantium cum distinctio facilis blanditiis, modi deserunt porro ad sit quidem, dolorem, pariatur voluptates. Eligendi ea corrupti sint amet mollitia aspernatur autem commodi sequi velit nihil impedit, architecto accusamus. Eveniet facilis, porro quibusdam architecto asperiores ipsa atque! Iste eum atque reprehenderit, dolor debitis delectus numquam molestiae labore incidunt explicabo magnam? Cumque nam laudantium, corporis fugiat vero illum facere dicta harum tempora maxime consequuntur eaque laboriosam enim nemo veniam tempore cupiditate quam. Perspiciatis laudantium minus voluptas vel dolores, doloremque sint unde eaque, expedita nobis in, accusamus illum! Fugiat, eveniet aut accusantium unde, saepe sed magni nam omnis porro repudiandae culpa repellat odit dolores. Dolorem harum eligendi minus voluptatibus eum consectetur eaque quidem iure ab aspernatur, quos fugiat quasi necessitatibus praesentium, autem ea corporis voluptas eos cumque itaque. Repellat tempore deleniti veniam qui deserunt velit laboriosam excepturi eveniet officia vitae, corporis autem dolorum possimus sequi porro non in repudiandae vel et. Animi excepturi architecto, nisi a sint aut? Nobis, quam eligendi explicabo voluptates adipisci nulla blanditiis pariatur totam, porro dignissimos, quaerat aperiam obcaecati incidunt deleniti.

        </div>

        <div className="msgsidebar">
          <div className="msgsidebarmain">
            <div className="msgsearchbar">
              <Search className="searchicon" size={16} />
              <input
                className="searchinput"
                placeholder="Search"
                type="text"
              />
            </div>
            <hr className="mt-4" />
            <div className="msgbuttons">
              <button className="msgbutton">
                <img src="/Chat/Recent.svg" alt="Recent icon" />
                Recent
              </button>
              <button className="msgbutton">
                <img src="/Chat/Chats.svg" alt="Chats icon" />
                Chats
              </button>
              <button className="msgbutton">
                <img src="/Chat/Clubs.svg" alt="Clubs icon" />
                Clubs
              </button>
            </div>
            <hr className="mt-4 mb-4" />

            <div className="chat">
              <div className="chatheader">
                <div className="clublogo">
                  <img src="/NITLOGO.webp" alt="NIT Logo" />
                </div>
                <div className="clubname">Innovation Cell</div>
              </div>




              <div className="allchats">
                <div className="msges">
                  <div className="msgbar">  
                    <input type="text" placeholder='Message' />
                    <button>
                      <img className='arrow-up' src="./Chat/Arrow-up.svg" alt="" />
                    </button>
                  </div>
                </div>

              </div>



            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
