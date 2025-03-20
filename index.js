const VIDEO_API = 'https://api.freeapi.app/api/v1/public/youtube/videos';

const getElement = query => document.querySelector(`${query}`);

const prev = getElement('.prev');
const next = getElement('.next');
const cPage = getElement('.current-page');
const template = getElement('.video-template');
const videoContainer = getElement('.cards');
const search = getElement('.search');
const localResponse = {};

// To Clear Previous Page Render
function clearDOM() {
    const cv = videoContainer.querySelectorAll('.video-card');
    cv.forEach(v => v.remove());
}

function setPageInfo(currPage,tPage) {
    if(currPage == 1) {
        prev.disabled = true;
    }
    else if(currPage == tPage) {
        next.disabled = true;
    }
    else if (currPage > 1 && currPage < tPage) {
        prev.disabled = false;
        next.disabled = false;
    }
    cPage.innerText = currPage;
}

// Render Videos
function renderVideos(videos) {
    videos.forEach(video => {
        const {videoId,title,channelTitle,thumbnail} = video;
        const videoNode = template.content.cloneNode(true);
        const titleElement = videoNode.querySelector('.title');
        const channelElement = videoNode.querySelector('.channel');
        
        titleElement.innerText = title;
        channelElement.innerText = channelTitle;
        videoContainer.appendChild(videoNode);
        const latestVideo = videoContainer.lastElementChild;
        const thumbnailElement = latestVideo.querySelector('.thumbnail');
        thumbnailElement.setAttribute('src',thumbnail);
        latestVideo.setAttribute('href',`https://www.youtube.com/watch?v=${videoId}`);
    });
}

// Pagination
next.addEventListener('click',() => {
    if(next.disabled) return;
    clearDOM();
    getVideos(+cPage.innerText + 1);
});

prev.addEventListener('click',() => {
    if(prev.disabled) return;
    clearDOM();
    getVideos(+cPage.innerText - 1);
});


async function getVideos(page=1) {
    clearDOM();

    // To use local response for render if available
    if(Object.keys(localResponse).includes(String(page))) {
        console.log('setting response from local for page', page);
        setPageInfo(localResponse[`${page}`].currentPage,localResponse[`${page}`].totalPages);
        renderVideos(localResponse[`${page}`].videos);
    }
    else{
        console.log('calling API for page',page);
        let response = await fetch(`${VIDEO_API}?page=${page}`);
        response = await response.json();

        const {page:currentPage, totalPages} = response?.data;
        const pageVideos = response?.data?.data;
        const videos = pageVideos.map(video => {
            return {
                videoId: video?.items?.id,
                title: video?.items?.snippet?.title,
                channelTitle: video?.items?.snippet?.channelTitle,
                thumbnail: video?.items?.snippet?.thumbnails?.high?.url,
            }
        });
        setPageInfo(currentPage,totalPages);
        renderVideos(videos);
        localResponse[`${page}`] = {currentPage,totalPages,videos};
    }
}

// Search across all available videos for all the pages
function searchVideos(searchText) {
    let s = searchText.trim();
    console.log(s)
    if(!s){
        getVideos(1);
        return;
    }
    clearDOM();

    const availableVideos = [...Object.values(localResponse)].map(obj => obj.videos).flat();
    console.log(availableVideos)
    console.log(localResponse?.videos);
    const searchedVideos = availableVideos.filter(video => video?.title.includes(s));
    renderVideos(searchedVideos);
}

// Using Debounce For Search
function debounce(cb,delay=500) {
    let sid = null;
    return function(...args) {
        clearTimeout(sid);
        sid = setTimeout(() => {
            cb(...args);
        },delay)
    }
}

const searchFilter = debounce(searchVideos,500);

search.addEventListener('input',() => {
    searchFilter(search.value);
})

// First Render
getVideos();