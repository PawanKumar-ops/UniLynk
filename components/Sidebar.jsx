"use client"

import React from 'react'
import "./Sidebar.css"
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { useState } from "react";
import { usePathname } from 'next/navigation';
import SignOutModal from './SignOutModal';
import { Mail } from 'lucide-react'

const Sidebar = () => {
  const { data: session } = useSession()
  const [settings, setSettings] = useState(true);
  const [showSignOutModal, setSignoutModal] = useState(false)
  const pathname = usePathname();

  const isActive = (path) => pathname === path;



  return (

    <div>
      {settings ? (
        <>
          <div>
            <header>
              <div className="menu">
                <div className="menuhead">
                  <div className="logo">
                    <img src="/ULynk.svg" alt="ULynk Logo" />
                  </div>

                  <div className="settings" onClick={() => setSettings(false)}>
                    <img src="/dashboard/Settings.svg" alt="settings" />
                  </div>
                </div>
                <div className="dashboard">

                  <Link href='/dashboard'>
                    <button className={`dashbutton ${isActive("/dashboard") ? "active" : ""}`} >
                      <img src="/dashboard/Home.svg" alt="Home icon" />
                      Home
                    </button>
                  </Link>

                  <Link href='/dashboard/my-clubs'>
                    <button className={`dashbutton ${isActive("/dashboard/my-clubs") ? "active" : ""}`}>
                      <img src="/dashboard/MyClubs.svg" alt="My Clubs icon" />
                      My Clubs
                    </button>
                  </Link>
                  <Link className='eventlink' href='/dashboard/events'>
                    <button className={`dashbutton ${isActive("/dashboard/events") ? "active" : ""}`}>
                      <img src="/dashboard/Events.svg" alt="Events icon" />
                      Events
                    </button>
                  </Link>
                  <Link className='eventlink' href='/dashboard/chat'>
                    <button className={`dashbutton ${isActive("/dashboard/chat") ? "active" : ""}`}>
                      <Mail />
                      Chat
                    </button>
                  </Link>


                  <div className="profile">
                    <div className="profback">
                      <img src="/Background.jpg" alt="Profile background" />
                    </div>
                    <div className="profpic">
                      <img src={session?.user?.image || '/Profilepic.png'} alt="Profile picture" />
                    </div>
                    <div className="profinfo">
                      <h2 className="username">{session?.user?.name || 'User'}</h2>
                      <div className="branch">{session?.user?.email || 'No email available'}</div>
                      <div className="year">{session?.user?.year || '_'}</div>
                    </div>
                    <div className="post">

                      <Link href="/dashboard/Userprofile" className='userprofilelink'><button className='viewprofilebtn'>View Profile</button></Link>

                    </div>
                  </div>
                </div>
              </div>
            </header>
          </div>
        </>
      ) : (
        <>
          <div>
            <header>
              <div className="menu">
                <div className="menuhead">
                  <div className="logo">
                    <img src="/ULynk.svg" alt="ULynk Logo" />
                  </div>

                  <div className="settings2" onClick={() => setSettings(true)}>
                    <img src="/myclubs/arrow.svg" alt="settings" />
                  </div>
                </div>
                <div className="dashboardsettings">
                  <div className="options">
                    <Link href='/dashboard/gethelp' >
                      <button className={`dashbutton gethelp ${isActive("/dashboard/gethelp") ? "active" : ""}`}>
                        <img src="/dashboard/GetHelp.svg" alt="Get Help icon" />
                        Get Help
                      </button>
                    </Link>
                  </div>



                  <div className="signout">
                    <button className="signoutb" onClick={() => setSignoutModal(true)} >Sign out <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="25"
                      viewBox="0 0 6.35 6.35"
                      fill="#ff0000"
                      id="logout"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.953.998a3.024 3.024 0 0 0-3.006 3.004V20a3.024 3.024 0 0 0 3.006 3.004h3.994A3.022 3.022 0 0 0 14.951 20v-4.002c0-1.334-2-1.334-2 0V20a.983.983 0 0 1-1.004 1.004H7.953A.983.983 0 0 1 6.95 20V4.002a.983.983 0 0 1 1.004-1.004h3.994a.983.983 0 0 1 1.004 1.004v4.002c0 1.334 2 1.334 2 0V4.002A3.022 3.022 0 0 0 11.947.998H7.953zM1.957 4.984a1 1 0 0 0-1.01 1.02v11.994a1 1 0 0 0 2 0V6.004a1 1 0 0 0-.982-1.02zm16.037 2.004a1 1 0 0 0-.096.004 1 1 0 0 0-.6 1.713L19.595 11h-9.588c-1.333.07-1.23 2.071.104 2.002h9.582l-2.29 2.287a1 1 0 1 0 1.411 1.418l4.002-4.002a1 1 0 0 0 0-1.41l-4.002-4a1 1 0 0 0-.715-.307z"
                        transform="scale(.26458)"
                      />
                    </svg>
                    </button>
                    {showSignOutModal && <SignOutModal onClose={() => setSignoutModal(false)} />}
                  </div>

                </div>
              </div>
            </header>
          </div>
        </>
      )}
    </div>
  )
}

export default Sidebar
