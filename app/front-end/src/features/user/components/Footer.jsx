import React from 'react'
import logo from '../../../assets/logo1.jpg'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux';

function Footer() {

    const currentYear = new Date().getFullYear();
    const activeTab = useSelector((state) => state.user.activeTab);

    return (
        <div className='px-[4%] sm:px-[12%]'>
            <div className='flex flex-col sm:flex-row items-center justify-between border-t border-gray-300 pt-4 sm:pt-2'>
                <div className='h-full flex flex-col justify-between'>
                    <div className='flex items-center'>
                        <div>
                            <img src={logo} alt="Logo" className="w-8 h-8" />
                        </div>
                        <div title='Home' className='font-arima text-2xl flex cursor-pointer' onClick={() => navigate('/')}>
                            <h1 className='inline'>read</h1>
                            <h1 className='inline font-bold text-primary'>rack</h1>
                        </div>
                    </div>
                </div>
                <div className='mt-4 sm:mt-0 flex font-semibold text-gray-500 space-x-4'>
                    <Link to='/series' className={`${activeTab === "Series" ? 'text-primary font-extrabold' : ''} font-arima text-sm`} >Series</Link>
                    <Link to='/authors' className={`${activeTab === "Authors" ? 'text-primary font-extrabold' : ''} font-arima text-sm`} >Authors</Link>
                    <Link to='/about-us' className={`${location.pathname.startsWith('/about-us') ? 'text-primary font-extrabold' : ''} font-arima text-sm`} >About us</Link>
                </div>
            </div>
            <span className='block py-2 text-xs text-center font-bold text-gray-500 mb-1 mt-4 sm:mt-0'>© {currentYear} readrack. All Rights Reserved.</span>
        </div>
    )
}

export default Footer