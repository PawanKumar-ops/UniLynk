"use client"

import React, { useState } from 'react';
import './dashboard.css';
import { Search } from 'lucide-react';
import PostFAB from '../components/PostFAB';
import Post from '../components/Post';

export default function Dashboard() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [ispost, setIspost] = useState(false)

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
                <button>View Profle</button>
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

Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto esse mollitia ipsum error ut vitae amet nesciunt quasi veniam voluptatibus velit minus nobis ex at, distinctio dolorum odio repudiandae excepturi adipisci culpa dolores. Aliquid nisi ipsum aspernatur recusandae iure omnis odit corrupti voluptatum nemo adipisci nam, illo impedit necessitatibus obcaecati odio illum ex quibusdam fuga voluptatem placeat consequuntur quo? Excepturi consequuntur temporibus voluptatem dicta porro aspernatur quam perspiciatis unde fuga? Necessitatibus explicabo perferendis fugiat vel magni cupiditate cum temporibus, tempora voluptatibus doloribus, magnam, ut perspiciatis nobis. Temporibus libero eveniet tenetur similique, optio minus fugit fuga doloremque recusandae quam fugiat, itaque cum suscipit porro aspernatur dolor vero pariatur sapiente, nostrum maiores consequatur repudiandae obcaecati. Nisi tenetur consequuntur sequi perferendis cumque repellendus dignissimos dolor, ad nihil vero earum impedit, assumenda magni rerum provident repellat aut ipsum! Consequatur asperiores tenetur accusantium, provident rem voluptatum, labore, vel nihil ipsa maiores praesentium vero autem doloremque blanditiis ratione! Harum sit dolor exercitationem, non velit quae vel iusto enim aliquid iste nam necessitatibus. Laudantium at nisi ipsa eum in perferendis aspernatur dolorem quisquam hic similique facilis dignissimos id debitis placeat ipsum nobis incidunt omnis nesciunt mollitia esse, tempora voluptates! Incidunt expedita ut inventore dolores voluptatem excepturi minus suscipit ea accusamus. Quod fugit beatae dolorem cupiditate rem numquam quaerat corporis, tempora quibusdam natus? Odio, harum error, natus recusandae aspernatur numquam sit nobis distinctio nostrum fuga nisi possimus non officia et reiciendis doloribus! Molestias, quae deleniti inventore veritatis placeat beatae cumque iusto similique accusantium nihil necessitatibus commodi sapiente sint natus repellat optio, quibusdam praesentium quasi numquam enim sed expedita accusamus aliquam? Quos, quasi ipsum beatae, veritatis, expedita voluptatum adipisci esse vel explicabo commodi ut. Minima repellendus, quas nostrum atque nemo illo autem sequi aperiam cupiditate explicabo adipisci, excepturi temporibus placeat soluta ipsum consequuntur eius voluptates. Tempora, ipsa, dolore velit, nostrum accusantium architecto possimus aut reiciendis qui officia est facilis ab fuga aliquid. Quidem, necessitatibus dolorem velit cumque amet repellendus tempora autem ducimus placeat! Error aperiam quaerat est illo voluptatibus adipisci et natus ad possimus obcaecati quisquam minus eum aliquid ipsam, quo, aliquam consequatur delectus alias ipsum molestias dicta quas qui repudiandae. Natus nobis ipsam quaerat, eius maiores distinctio asperiores itaque ad molestiae vel tempora assumenda excepturi, sit dolorum eligendi quod, at dolor ut consectetur nesciunt. Ab impedit repellat error laborum doloribus? Adipisci autem culpa sapiente aperiam, ex, ea dolore nostrum maxime porro excepturi quia, iste vero reiciendis perspiciatis! Quidem maxime, dolorum magni repellat illum esse labore temporibus et minima inventore distinctio officia asperiores dolorem? Sint voluptatum necessitatibus iusto rem, ducimus incidunt reiciendis dolorum dolorem deserunt reprehenderit, ullam in veritatis veniam! Id ab, ut incidunt exercitationem reiciendis veritatis numquam earum, vitae saepe ipsa blanditiis! Et sed expedita, a laboriosam aliquam repellat, quae in assumenda hic cum ab facilis tempora maxime quas consectetur numquam sint facere dolore dolores magni natus perferendis nobis quaerat enim. Doloremque accusamus minus fugiat nulla! Iusto quod, ipsum esse ratione eveniet fuga? Laudantium, molestiae eligendi pariatur ab ex amet voluptates necessitatibus, accusamus hic iste odit possimus suscipit soluta. Vitae quisquam sed ut pariatur veniam nisi earum quaerat laborum ab sapiente adipisci nulla repudiandae at natus ducimus, labore numquam quidem voluptate. Deserunt dolorum quod, consectetur, ratione debitis aperiam quasi architecto nobis illo vel molestiae quis! Ipsum delectus consectetur ipsam nesciunt quo error, dignissimos soluta neque eaque dolor architecto fugit. Corrupti animi aperiam id modi expedita dignissimos, consequuntur molestiae autem magnam fuga commodi sit voluptatem impedit neque esse excepturi. Suscipit ratione sint nostrum! Temporibus quod repudiandae molestiae ea! Rem, temporibus quidem omnis saepe voluptates id et laborum? Alias ex vero facere optio nobis eveniet in voluptatibus cupiditate officia consectetur eum voluptates saepe rem delectus provident, quas, error quaerat, iure expedita. Molestias ipsa ad deleniti sint, nam quia inventore! Recusandae, blanditiis dolore eaque nemo soluta voluptatem rerum nostrum nisi impedit, sit tenetur, minus a obcaecati ea molestiae quam pariatur nulla modi atque aliquam harum quibusdam doloremque? Saepe sit ipsa, vel consectetur ad inventore accusamus aspernatur fugiat suscipit voluptates facilis, illo debitis architecto dignissimos modi sed quisquam non aliquid omnis temporibus facere. Eius vel, sed quidem quaerat quasi optio atque suscipit, ea reprehenderit minima ipsam deleniti nesciunt praesentium corrupti eligendi. Nesciunt enim ab porro architecto quidem qui doloremque saepe cupiditate assumenda.

          <PostFAB setIspost={setIspost}/>

        </div>
        {ispost ?
        (<Post setIspost={setIspost}/>):(<div className="msgsidebar">
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
        </div>)}
      </main>
    </div>
  );
}
