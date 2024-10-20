import React, { useEffect, useState } from 'react';
import axiosUtils from '../../../utils/axiosUtils';
import { capitalize, capitalizeGenres, spacesToHyphens } from '../../../utils/stringUtils';
import { bufferToBlobURL } from '../../../utils/imageUtils';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import Recommendations from '../recommendations/Recommendations';
import NotFoundPage from '../../../pages/NotFoundPage';
import blank_image from '../../../assets/brand_blank_image.png';
import DeatailsPageSkeleton from '../../../components/skeletons/DeatailsPageSkeleton';
import { useSocket } from '../../../context/SocketContext';
import NetworkErrorPage from '../../../pages/NetworkErrorPage';
import { sortByPublishDateAsc } from '../../../utils/sortingUtils';

function CollectionDetails() {

  const activeTab = useSelector((state) => state.user.activeTab);
  const { collectionId, collectionName } = useParams();
  const [collectionData, setCollectionData] = useState({});
  const [books, setBooks] = useState([]);
  const [IsLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [networkError, setNetworkError] = useState(false);

  const [booksLimit, setBooksLimit] = useState();
  const [booksRange, setBooksRange] = useState();
  const [booksCount, SetBooksCount] = useState();
  const socket = useSocket();

  const navigate = useNavigate();

  useEffect(() => {
    const updatePageLimitAndInterval = () => {
      const width = window.innerWidth;
      if (width >= 1024) {
        setBooksLimit(6);
        setBooksRange(6);
      } else {
        setBooksLimit(5);
        setBooksRange(5);
      }
    };

    updatePageLimitAndInterval();
    window.addEventListener('resize', updatePageLimitAndInterval);

    return () => {
      window.removeEventListener('resize', updatePageLimitAndInterval);
    };
  }, [collectionId]);

  useEffect(() => {
    const fetchCollectionsData = async () => {
      setIsLoading(true);
      try {
        const collectionResponse = await axiosUtils(`/api/getCollectionById/${collectionId}`, 'GET');
        setCollectionData(collectionResponse.data);

        // If collectionName is not in the URL, update it
        if (!collectionName || collectionName !== collectionResponse.data.collectionName) {
          navigate(`/collections/${collectionId}/${spacesToHyphens(collectionResponse.data.collectionName)}`, { replace: true });
        }

        const booksResponse = await axiosUtils(`/api/getBooksByCollectionId/${collectionResponse.data.id}`, 'GET');
        // console.log('Books response:', booksResponse.data); // Debugging

        // Sort the books by publish date or custom date
        const sortedBooks = booksResponse.data.books.sort(sortByPublishDateAsc);

        setBooks(sortedBooks);
        SetBooksCount(booksResponse.data.totalCount);
        // console.log('The total count is:', booksResponse.data.totalCount);

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching collections data:', error);
        if (error.message === "Network Error" || error.response.status === 500 || error.response.status === 501) {
          setNetworkError(true);
        } else if (error.response && error.response.status === 404) {
          setNotFound(true);
        }
        setIsLoading(false);
      }
    };

    fetchCollectionsData();

    if (!socket) {
      console.error("Socket is not initialized");
      return;
    }

    socket.on('collectionsUpdated', (updatedCollections) => {
      setCollectionData((prevCollectionData) => {
        // Only update if the IDs match
        if (prevCollectionData.id === updatedCollections.id) {
          // console.log("The ids are equal...............")
          return {
            ...prevCollectionData,
            ...updatedCollections,
          };
        }

        return prevCollectionData; // Return the previous state if IDs don't match
      });
    });

    // Event listener for booksUpdated
    socket.on('booksUpdated', (updatedBooks) => {
      // console.log('Books updated via socket:', updatedBooks);
      setBooks((prevData) => {
        const updatedData = prevData.map((book) =>
          book.id === updatedBooks.id ? updatedBooks : book
        );

        // Sort the updatedData by date in ascending order (oldest first)
        return updatedData.sort(sortByPublishDateAsc);
      });
    });

    // Event listener for bookAdded
    socket.on('bookAdded', (bookData) => {
      if (bookData.collection_id === parseInt(collectionId)) {
        setBooks((prevData) => {
          const updatedData = [...prevData, bookData];

          // Sort the updatedData by date in ascending order (oldest first)
          return updatedData.sort(sortByPublishDateAsc);
        });
        SetBooksCount((prevCount) => prevCount + 1);
        if (booksLimit >= booksRange) setBooksLimit((prevCount) => prevCount + 1);
      }
    });

    socket.on('dataDeleted', ({ ids, type }) => {
      // console.log('Data deleted via socket:', { ids, type });
      if (type = 'books') {
        setBooks((prevData) => prevData.filter((item) => !ids.includes(item.id)));
        SetBooksCount((prevCount) => prevCount - ids.length);
      }
    });


    return () => {
      socket.off('collectionsUpdated');
      socket.off('booksUpdated');
      socket.off('bookAdded');
      socket.off('dataDeleted');
    };

  }, [collectionId, collectionName, navigate, socket]);

  const handleSetLimit = () => {
    if (window.innerWidth >= 1024) {
      setBooksLimit(booksLimit === 6 ? booksCount : 6);
    } else {
      setBooksLimit(booksLimit === 5 ? booksCount : 5);
    }
    // console.log('Books limit set to:', booksLimit);
  }

  if (IsLoading) {
    return <DeatailsPageSkeleton activeTab={activeTab} admin={false} />;
  } else if (notFound) {
    return <NotFoundPage type='collection' />
  } else if (networkError) {
    return <NetworkErrorPage />
  }


  return (
    <div className=' px-[4%] sm:px-[12%]'>
      <div className='md:flex md:flex-row pt-2 md:space-x-6 xl:space-x-8 pb-10'>
        <div className='w-full pt-2 md:w-[22rem] md:h-full md:sticky md:top-20 lg:top-[4.5rem] overflow-hidden'>
          <div className=' max-w-[13rem] mx-auto'>
            <img src={collectionData.imageURL || blank_image} alt="" className='h-[16rem] w-full bg-[rgba(3,149,60,0.08)] rounded-lg mx-auto object-cover' loading="lazy" />
            <div className='w-full mx-auto'>
              <p
                title={capitalize(collectionData.collectionName)}
                className='font-poppins font-medium text-lg text-center md:text-left mt-2 md:overflow-hidden md:whitespace-nowrap md:text-ellipsis cursor-default'
              >
                {capitalize(collectionData.collectionName)}
              </p>
              {collectionData.author_id && (
                <p
                  className='font-arima text-center md:text-left'
                >
                  <span>by </span>
                  {collectionData.authors.map(author => (
                    <span
                      key={author.author_id}
                      className='hover:underline cursor-pointer'
                      onClick={() => navigate(`/authors/${author.author_id}/${spacesToHyphens(author.author_name)}`)}
                    >
                      {capitalize(author.nickname || author.author_name)}
                    </span>
                  )).reduce((prev, curr) => [prev, ', ', curr])}
                </p>
              )}
              <div className='w-full md:items-center mt-4 leading-3 md:max-w-[90%]'>
                <p className='md:inline font-medium font-poppins text-center md:text-left text-sm'>Genres:</p>
                <div className='md:inline flex flex-wrap gap-x-2 md:ml-1 text-sm text-center md:text-left font-arima items-center justify-center md:justify-start w-[90%] mx-auto'>
                  {capitalizeGenres(collectionData.genres)}
                </div>
              </div>
            </div>
          </div>
          {collectionData.link &&
            <a
              href={collectionData.link}
              target="_blank"
              rel="noopener noreferrer"
              className='bg-[#37643B] block w-[60%] md:w-full text-center text-white text-sm font-semibold font-poppins p-3 rounded-lg mx-auto mt-6 on-click-amzn'>
              Find on Amazon
            </a>
          }
        </div>
        <div className='w-full '>
          <div className='flex justify-between items-center mt-8 md:mt-0'>
            <p className='font-poppins font-semibold text-xl 2xl:text-center'>
              {capitalize(collectionData.collectionName)} Books:
            </p>
          </div>
          <div className='w-full grid 2xl:grid lg:grid-cols-2 gap-x-4'>
            {books.slice(0, booksLimit).map((item, index) => (
              <div key={item.id} className='flex space-x-2 mt-4 pb-3 border-b-2 border-gray-100 cursor-default'>
                <img
                  src={item.imageURL || blank_image} // Fallback image if Blob URL is null
                  alt=''
                  className='bg-[rgba(3,149,60,0.08)] min-h-[9rem] w-[6rem] rounded-lg object-cover'
                  loading="lazy"
                />
                <div className='min-h-full w-full flex flex-col'>
                  <div className='flex justify-between items-center'>
                    <p className='font-semibold m-0 leading-5 text-lg'>
                      {capitalize(item.bookName)}
                    </p>
                  </div>
                  {item.authors.length > 0 && (
                    <p className='font-arima text-sm'>by {item.authors.map(author => capitalize(author.nickname || author.author_name)).join(', ')}</p>
                  )}
                  <p className='font-arima text-slate-400 text-sm mt-1'>
                    #{index + 1}, published {item.publishDate}
                  </p>
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className='bg-[#37643B] block w-full text-center text-white text-sm font-semibold font-poppins p-3 rounded-lg mt-auto on-click-amzn'
                  >
                    Find on Amazon
                  </a>
                </div>
              </div>
            ))}
          </div>
          {(booksCount > booksLimit || booksLimit > booksRange) && (
            <span
              onClick={() => handleSetLimit()}
              className='text-sm max-w-fit mt-2 hover:underline text-green-700 font-semibold font-arima cursor-pointer'
            >
              {booksLimit < booksCount ? 'Show more' : 'Show less'}
            </span>
          )}
        </div>
      </div>
      <Recommendations data={collectionData} tab='Series' />
    </div>
  );
}

export default CollectionDetails
