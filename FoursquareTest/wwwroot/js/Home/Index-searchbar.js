
async function loadLocalMapSearchJs() {

    const base_url = window.location.origin;
    const get_bookmarks_by_user_url = `${base_url}/Home/GetBookmarksByUser`;
    const create_bookmark_url = `${base_url}/Home/CreateBookmark`;
    const delete_bookmark_url = `${base_url}/Home/DeleteBookmark`;

    let bookmarkArray = await GetBookmarksByUser();

    //mapboxgl.accessToken = 'pk.eyJ1IjoiemVyby1tYXBib3giLCJhIjoiY2x1ZG5vbDBnMDNhZjJqbnR0NTFuajllMSJ9.3X0MCU_HDIT8hNYwn3jQDg';
    const fsqAPIToken = 'fsq3j4GItZknryfDOoi/xnVQXKrUtGvhgbybo+3Ym9fqKH4=';
    let userLat = 40.7128;
    let userLng = -74.0060;
    let sessionToken = generateRandomSessionToken();
    const searchInput = document.getElementById('search-input');
    const searchForm = document.getElementById('search-form');
    const suggerenceContainer = document.getElementById('suggerence-container');
    const suggerenceList = document.getElementById('suggerence-list');
    const suggerenceErrorField = document.getElementById('suggerence-error');
    const suggerenceNotFoundField = document.getElementById('suggerence-not-found');

    const searchList = document.getElementById('search-list');
    const searchErrorField = document.getElementById('search-error');
    const searchNotFoundField = document.getElementById('search-not-found');

    const searchCloseButton = document.getElementById('search-close-button');
    const searchSpinner = document.getElementById('search-spinner');

    const searchSidePanelElement = document.getElementById('search-side-panel');
    let searchSidePanelInstance = new bootstrap.Collapse(searchSidePanelElement, { toggle: false });

    const bookmarkToggleButton = document.getElementById('bookmark-toggle-button');

    const bookmarkSidePanelElement = document.getElementById('bookmark-side-panel');
    let bookmarkSidePanelInstance = new bootstrap.Collapse(bookmarkSidePanelElement, { toggle: false });

    let bookmarkList = document.getElementById('bookmark-list');

    const mapContainer = document.getElementById('map');

    await setBookmarkList();

    suggerenceContainer.style.display = 'none';
    searchErrorField.style.display = 'none';
    searchSpinner.style.display = 'none';

    const onChangeAutoComplete = debounce(changeAutoComplete);
    searchInput.addEventListener('input', onChangeAutoComplete);

    const toggleSuggerenceResetButton = (e) => {
        if (e.target.value && !searchInput.classList.contains("clear-input--touched")) {
            searchInput.classList.add("clear-input--touched")
        } else if (!e.target.value && searchInput.classList.contains("clear-input--touched")) {
            searchInput.classList.remove("clear-input--touched")
        }
    }

    searchInput.addEventListener("input", toggleSuggerenceResetButton);

    suggerenceList.addEventListener('click', selectSuggerenceItem);

    const onGetSearchResults = (event) => {
        searchSpinner.style.display = 'block';
        debounce(getSearchResults(event));
    };
    searchForm.addEventListener('submit', onGetSearchResults);

    searchList.addEventListener('click', selectSearchItem);

    searchCloseButton.addEventListener('click', (event) => toggleCollapse(event, searchSidePanelInstance));

    bookmarkToggleButton.addEventListener('click', (event) => toggleCollapse(event, bookmarkSidePanelInstance));

    searchList.addEventListener('click', CreateOrDeleteBookmark);

    bookmarkList.addEventListener('click', DeleteBookmarkAndRemoveFromList);

    mapContainer.addEventListener('click', CreateOrDeleteBookmark);

    mapContainer.addEventListener('click', viewDetails);

    //function success(pos) {
    //    const { latitude, longitude } = pos.coords;
    //    userLat = latitude;
    //    userLng = longitude;
    //    flyToLocation(userLat, userLng);
    //}

    function logError(err) {
        console.warn(`ERROR(${err.code}): ${err.message}`);
    }

    //navigator.geolocation.getCurrentPosition(success, logError, {
    //    enableHighAccuracy: true,
    //    timeout: 5000,
    //    maximumAge: 0,
    //});

    let currentMarker;

    /* Generate a random string with 32 characters.
       Session Token is a user-generated token to identify a session for billing purposes. 
       Learn more about session tokens.
       https://docs.foursquare.com/reference/session-tokens
    */
    function generateRandomSessionToken(length = 32) {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        for (let i = 0; i < length; i++) {
            result += characters[Math.floor(Math.random() * characters.length)];
        }
        return result;
    }

    function toggleCollapse(event, collapseInstance) {
        collapseInstance.toggle();
    }

    let isFetchingSearch = false;
    async function getSearchResults(event) {
        event.preventDefault();

        bookmarkSidePanelInstance.hide();

        searchList.innerHTML = '';
        searchNotFoundField.style.display = 'none';
        searchErrorField.style.display = 'none';

        inputSearch = searchInput.value;

        if (inputSearch.length && !isFetchingSearch) {
            try {
                isFetchingSearch = true;
                const searchResults = await search(inputSearch);
                if (searchResults && searchResults.length) {
                    searchResults.forEach((value) => {
                        addSearchResultItem(value);
                    });
                } else {
                    searchNotFoundField.innerHTML = `Foursquare can't
                find ${inputSearch}. Make sure your search is spelled correctly.  
                <a href="https://foursquare.com/add-place?ll=${userLat}%2C${userLng}&venuename=${inputSearch}"
                  target="_blank" rel="noopener noreferrer">Don't see the place you're looking for?</a>.`;
                    searchNotFoundField.style.display = 'block';
                    suggerenceContainer.style.display = 'none';
                }
            } catch (err) {
                searchSidePanelInstance.show();
                searchErrorField.style.display = 'block';
                suggerenceContainer.style.display = 'none';
                logError();
            } finally {
                isFetchingSearch = false;
                searchSidePanelInstance.show();
                suggerenceContainer.style.display = 'none';
                searchSpinner.style.display = 'none';
            }
        } else {
            searchSidePanelInstance.hide();
            suggerenceContainer.style.display = 'none';
            searchSpinner.style.display = 'none';
        }
    }

    async function search(query) {
        const { lng, lat } = map.getCenter();
        userLat = lat;
        userLng = lng;
        try {
            const searchParams = new URLSearchParams({
                query,
                types: 'place',
                ll: `${userLat},${userLng}`,
                radius: 50000,
                session_token: sessionToken,
                locale: 'es',
                'explicit-lang': true
            }).toString();
            const searchResults = await fetch(
                `https://api.foursquare.com/v3/places/search?${searchParams}`,
                {
                    method: 'get',
                    headers: new Headers({
                        Accept: 'application/json',
                        Authorization: fsqAPIToken,
                    }),
                }
            );
            const data = await searchResults.json();
            return data.results;
        } catch (error) {
            throw error;
        }
    }

    function addSearchResultItem(value) {
        const placeDetail = value;
        if (!placeDetail || !placeDetail.geocodes || !placeDetail.geocodes.main) return;

        const { location = {}, name = '', photos = [], rating } = placeDetail;

        const fsqId = placeDetail.fsq_id;
        const { latitude, longitude } = placeDetail.geocodes.main;
        const formattedAddress = location.formatted_address;

        const bookmark = bookmarkArray.find(bmrk => bmrk.fsqId == fsqId);

        let createClass = '';
        let actionValue = 'createbookmark';

        let dataObject = JSON.stringify({ latitude, longitude, name, "formatted_address": formattedAddress, fsqId });

        if (bookmark) {
            createClass = 'material-symbols-filled';
            actionValue = 'deletebookmark';
            dataObject = JSON.stringify(bookmark);
        }



        searchList.innerHTML +=
            `<li class="list-group search-suggestion p-3" data-object='${dataObject}'>
            <div class="pe-none">${value.name}</div>
            <div class="text-muted pe-none">${value.location.formatted_address}</div>
            <button class="btn btn-light border-danger rounded-circle text-danger shadow-sm p-0 ms-auto" type="button" data-action="${actionValue}" data-object='${dataObject}'>
                <span class="material-symbols-outlined ${createClass} m-1 pe-none">bookmark</span>
            </button>
          </li>`;
    }

    async function selectSearchItem({ target }) {
        if (target.tagName === 'LI') {
            const valueObject = JSON.parse(target.dataset.object);
            const { latitude, longitude, fsqId } = valueObject;
            const placeDetail = await fetchPlacesDetails(fsqId);
            addMarkerAndPopup(latitude, longitude, placeDetail);
            flyToLocation(latitude, longitude);

            // generate new session token after a complete search
            sessionToken = generateRandomSessionToken();
        }
    }

    let isFetchingSuggerences = false;
    async function changeAutoComplete({ target }) {
        const { value: inputSearch = '' } = target;
        suggerenceList.innerHTML = '';
        suggerenceNotFoundField.style.display = 'none';
        suggerenceErrorField.style.display = 'none';
        if (inputSearch.length && !isFetchingSuggerences) {
            try {
                isFetchingSuggerences = true;
                const results = await autoComplete(inputSearch);
                if (results && results.length) {
                    results.forEach((value) => {
                        addSuggerenceItem(value);
                    });
                } else {
                    suggerenceNotFoundField.innerHTML = `Foursquare can't
                find ${inputSearch}. Make sure your search is spelled correctly.  
                <a href="https://foursquare.com/add-place?ll=${userLat}%2C${userLng}&venuename=${inputSearch}"
                  target="_blank" rel="noopener noreferrer">Don't see the place you're looking for?</a>.`;
                    suggerenceNotFoundField.style.display = 'block';
                }
            } catch (err) {
                suggerenceErrorField.style.display = 'block';
                logError(err);
            } finally {
                isFetchingSuggerences = false;
                suggerenceContainer.style.display = 'block';
            }
        } else {
            suggerenceContainer.style.display = 'none';
            searchSidePanelInstance.hide();
        }
    }

    async function autoComplete(query) {
        const { lng, lat } = map.getCenter();
        userLat = lat;
        userLng = lng;
        try {
            const searchParams = new URLSearchParams({
                query,
                types: 'place',
                ll: `${userLat},${userLng}`,
                radius: 50000,
                session_token: sessionToken,
            }).toString();
            const searchResults = await fetch(
                `https://api.foursquare.com/v3/autocomplete?${searchParams}`,
                {
                    method: 'get',
                    headers: new Headers({
                        Accept: 'application/json',
                        Authorization: fsqAPIToken,
                    }),
                }
            );
            const data = await searchResults.json();
            return data.results;
        } catch (error) {
            throw error;
        }
    }

    function addSuggerenceItem(value) {
        const placeDetail = value[value.type];
        if (!placeDetail || !placeDetail.geocodes || !placeDetail.geocodes.main) return;
        const { latitude, longitude } = placeDetail.geocodes.main;
        const fsqId = placeDetail.fsq_id;
        const dataObject = JSON.stringify({ latitude, longitude, fsqId });
        suggerenceList.innerHTML +=
            `<li class="list-group search-suggestion p-3" data-object='${dataObject}'>
            <div class="pe-none">${highlightedNameElement(value.text)}</div>
            <div class="text-muted pe-none">${value.text.secondary}</div>
          </li>`;
    }

    async function selectSuggerenceItem({ target }) {
        if (target.tagName === 'LI') {
            const valueObject = JSON.parse(target.dataset.object);
            const { latitude, longitude, fsqId } = valueObject;
            const placeDetail = await fetchPlacesDetails(fsqId);
            addMarkerAndPopup(latitude, longitude, placeDetail);
            flyToLocation(latitude, longitude);

            // generate new session token after a complete search
            sessionToken = generateRandomSessionToken();
            const name = target.dataset.name;
            searchInput.value = target.children[0].textContent;
            suggerenceContainer.style.display = 'none';
        }
    }

    async function fetchPlacesDetails(fsqId) {
        try {
            const searchParams = new URLSearchParams({
                fields: 'fsq_id,name,geocodes,location,photos,rating',
                session_token: sessionToken,
            }).toString();
            const results = await fetch(
                `https://api.foursquare.com/v3/places/${fsqId}?${searchParams}`,
                {
                    method: 'get',
                    headers: new Headers({
                        Accept: 'application/json',
                        Authorization: fsqAPIToken,
                    }),
                }
            );
            const data = await results.json();
            return data;
        } catch (err) {
            logError(err);
        }
    }

    function createPopup(placeDetail) {
        const { location = {}, name = '', photos = [], rating } = placeDetail;
        let photoUrl = 'https://files.readme.io/c163d6e-placeholder.svg';
        if (photos.length && photos[0]) {
            photoUrl = `${photos[0].prefix}56${photos[0].suffix}`;
        }

        const fsqId = placeDetail.fsq_id;
        const { latitude, longitude } = placeDetail.geocodes.main;
        const formattedAddress = location.formatted_address;

        const bookmark = bookmarkArray.find(bmrk => bmrk.fsqId == fsqId);

        let createClass = '';
        let actionValue = 'createbookmark';

        let dataObject = JSON.stringify({ latitude, longitude, name, "formatted_address": formattedAddress, fsqId });

        if (bookmark) {
            createClass = 'material-symbols-filled';
            actionValue = 'deletebookmark';
            dataObject = JSON.stringify(bookmark);
        }

        const popupHTML =   `<div class="card">
                                <div class="card-body">
                                    <div class="text-center mb-2">
                                        <img class="rounded shadow-sm" height="70" src="${photoUrl}" alt="photo of ${name}">
                                    </div>
                                    <h5 class="card-title">
                                        ${name}
                                    </h5>
                                    <h6 class="card-subtitle mb-2 text-muted">${location.formatted_address}</h6>
                                    <h6 class="d-flex align-items-center fw-bold">${rating ?? ` - `} <span class="material-symbols-outlined text-warning rounded-circle shadow-sm mx-1 fs-4">stars</span></h5>
                                    
                                    <div class="btn-toolbar justify-content-end" role="toolbar" aria-label="Toolbar with button groups">
                                        
                                        <button class="btn btn-light border-danger rounded-circle text-danger shadow-sm p-0" type="button" data-action="${actionValue}" data-object='${dataObject}'>
                                            <span class="material-symbols-outlined ${createClass} m-1 pe-none">bookmark</span>
                                        </button>
                                    </div>
                                </div>
                            </div>`;

        const markerHeight = 35;
        const markerRadius = 14;
        const linearOffset = 8;
        const verticalOffset = 8;
        const popupOffsets = {
            top: [0, verticalOffset],
            'top-left': [0, verticalOffset],
            'top-right': [0, verticalOffset],
            bottom: [0, -(markerHeight + verticalOffset)],
            'bottom-left': [0, (markerHeight + verticalOffset - markerRadius + linearOffset) * -1],
            'bottom-right': [0, (markerHeight + verticalOffset - markerRadius + linearOffset) * -1],
            left: [markerRadius + linearOffset, (markerHeight - markerRadius) * -1],
            right: [-(markerRadius + linearOffset), (markerHeight - markerRadius) * -1],
        };
        return new mapboxgl.Popup({
            offset: popupOffsets,
            closeButton: false,
        }).setHTML(popupHTML);
    }

    function addMarkerAndPopup(lat, lng, placeDetail) {
        if (currentMarker) currentMarker.remove();
        currentMarker = new mapboxgl.Marker({
            color: 'red',
        })
            .setLngLat([lng, lat])
            .setPopup(createPopup(placeDetail))
            .addTo(map);

        currentMarker.togglePopup();
    }

    function flyToLocation(lat, lng) {
        map.flyTo({
            center: [lng, lat],
        });
    }

    function highlightedNameElement(textObject) {
        if (!textObject) return '';
        const { primary, highlight } = textObject;
        if (highlight && highlight.length) {
            let beginning = 0;
            let hightligtedWords = '';
            for (let i = 0; i < highlight.length; i++) {
                const { start, length } = highlight[i];
                hightligtedWords += primary.substr(beginning, start - beginning);
                hightligtedWords += '<b>' + primary.substr(start, length) + '</b>';
                beginning = start + length;
            }
            hightligtedWords += primary.substr(beginning);
            return hightligtedWords;
        }
        return primary;
    }

    function debounce(func, timeout = 300) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                func.apply(this, args);
            }, timeout);
        };
    }

    async function GetBookmarksByUser() {
        try {
            const results = await fetch(
                get_bookmarks_by_user_url,
                {
                    method: 'get',
                    headers: new Headers({
                        'Accept': 'application/json',
                        //'Content-Type': 'application/json'
                    }),
                }
            );
            const data = await results.json();

            let bookmarksList = [];

            if (data.value && data.value.isSuccess == true) {
                bookmarksList = data.value.result;
            }

            return bookmarksList;

        } catch (err) {
            logError(err);
        }
    }

    async function setBookmarkList() {
        if (bookmarkArray && bookmarkArray.length) {
            bookmarkArray.forEach((value) => {
                addBookmarkToList(value);
            });
        }
    }

    function addBookmarkToList(bookmark) {
        const dataObject = JSON.stringify(bookmark);

        bookmarkList.innerHTML +=
            `<li class="list-group search-suggestion p-3" data-object='${dataObject}'>
            <div class="pe-none">${bookmark.name}</div>
            <div class="text-muted pe-none">${bookmark.formatted_address}</div>
            <button class="btn btn-light border-danger rounded-circle text-danger shadow-sm p-0 ms-auto" type="button" data-action="deletebookmark" data-object='${dataObject}'>
                <span class="material-symbols-outlined material-symbols-filled m-1 pe-none">delete_forever</span>
            </button>
          </li>`;
    }

    function removeBookmarkFromList(bookmark) {
        const dataObject = JSON.stringify(bookmark);

        bookmarInList = bookmarkList.querySelector(`li[data-object='${dataObject}']`);
        bookmarInList.remove();
    }

    async function DeleteBookmarkAndRemoveFromList(event) {
        event.preventDefault();

        const target = event.target;

        const bookmark = JSON.parse(target.dataset.object);

        if (target.tagName == 'BUTTON' && target.dataset.action && target.dataset.action == 'deletebookmark') {
            const data = await deleteBookmark(bookmark.id);
            if (data.value && data.value.isSuccess == true) {
                //changeBookmarkButtonToCreateAction(target);
                removeBookmarkFromList(bookmark);
            }
        }
    }

    async function CreateOrDeleteBookmark(event) {
        event.preventDefault();

        const target = event.target;

        const currentBookmark = JSON.parse(target.dataset.object);

        if (target.tagName == 'BUTTON' && target.dataset.action && target.dataset.action == 'createbookmark') {
            const data = await createBookmark(currentBookmark);
            if (data.value && data.value.isSuccess == true) {

                const newBookmark = data.value.result;

                changeBookmarkButtonToDeleteAction(newBookmark);
                addBookmarkToList(newBookmark);
            }

        } else if (target.tagName == 'BUTTON' && target.dataset.action && target.dataset.action == 'deletebookmark') {
            const data = await deleteBookmark(currentBookmark.id);
            if (data.value && data.value.isSuccess == true) {
                changeBookmarkButtonToCreateAction(currentBookmark);
                removeBookmarkFromList(currentBookmark);
            }
        }
        else {
            return;
        }
    }

    async function createBookmark(newBookmark) {

        console.log("funciono el evento createbookmark en el mapa");
        console.log(newBookmark);
        console.log("llamando a la api para ejecutar el create");

        const newBookmarkJson = JSON.stringify(newBookmark);

        try {
            const results = await fetch(
                create_bookmark_url,
                {
                    method: 'post',
                    headers: new Headers({
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                        /*Authorization: fsqAPIToken,*/
                    }),
                    body: newBookmarkJson,
                }
            );
            const data = await results.json();
            return data;

        } catch (err) {
            logError(err);
        }
    }

    async function deleteBookmark(bookmarkId) {
        console.log("funciono el evento deletebookmark en el mapa");
        
        console.log(bookmarkId);
        console.log("llamando a la api para ejecutar el create");

        try {
            const results = await fetch(
                delete_bookmark_url,
                {
                    method: 'post',
                    headers: new Headers({
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                        /*Authorization: fsqAPIToken,*/
                    }),
                    body: bookmarkId,
                }
            );
            const data = await results.json();
            return data;

        } catch (err) {
            logError(err);
        }
    }

    function changeBookmarkButtonToCreateAction(bookmark) {

        //delete from list start
        const bkitem = bookmarkArray.find(bk => bk.id == bookmark.id);
        bookmarkArray.splice(bkitem, 1);

        console.log(bookmarkArray);
        //delete from list end

        const currentDataObject = JSON.stringify(bookmark);

        const newDataObject = {
            latitude: bookmark.latitude,
            longitude: bookmark.longitude,
            name: bookmark.name,
            "formatted_address": bookmark.formatted_address,
            fsqId: bookmark.fsqId
        }

        const newDataObjectJson = JSON.stringify(newDataObject);

        const itemInList = searchList.querySelector(`li[data-object='${currentDataObject}']`);
        if (itemInList) {
            const buttonInList = itemInList.querySelector(`button[data-object='${currentDataObject}']`);
            const spanInButtonInList = buttonInList.querySelector('span.material-symbols-outlined');

            itemInList.dataset.object = newDataObjectJson;
            buttonInList.dataset.action = 'createbookmark';
            buttonInList.dataset.object = newDataObjectJson;
            spanInButtonInList.classList.remove('material-symbols-filled');
        }

        const buttonInMap = mapContainer.querySelector(`button[data-object='${currentDataObject}']`);

        if (buttonInMap) {
            const spanInButtonInMap = buttonInMap.querySelector('span.material-symbols-outlined');

            buttonInMap.dataset.action = 'createbookmark';
            buttonInMap.dataset.object = newDataObjectJson;
            spanInButtonInMap.classList.remove('material-symbols-filled');
        }
    }

    function changeBookmarkButtonToDeleteAction(bookmark) {

        //add to list start
        bookmarkArray.push(bookmark);
        console.log(bookmarkArray);
        //add to list end

        const newDataObjectJson = JSON.stringify(bookmark);

        const currentDataObject = {
            latitude: bookmark.latitude,
            longitude: bookmark.longitude,
            name: bookmark.name,
            "formatted_address": bookmark.formatted_address,
            fsqId: bookmark.fsqId
        }

        const currentDataObjectJson = JSON.stringify(currentDataObject);

        const itemInList = searchList.querySelector(`li[data-object='${currentDataObjectJson}']`);

        if (itemInList) {
            const buttonInList = itemInList.querySelector(`button[data-object='${currentDataObjectJson}']`);
            const spanInButtonInList = buttonInList.querySelector('span.material-symbols-outlined');

            itemInList.dataset.object = newDataObjectJson;
            buttonInList.dataset.action = 'deletebookmark';
            buttonInList.dataset.object = newDataObjectJson;
            spanInButtonInList.classList.add('material-symbols-filled');
        }

        const buttonInMap = mapContainer.querySelector(`button[data-object='${currentDataObjectJson}']`);
        if (buttonInMap) {
            const spanInButtonInMap = buttonInMap.querySelector('span.material-symbols-outlined');

            buttonInMap.dataset.action = 'deletebookmark';
            buttonInMap.dataset.object = newDataObjectJson;
            spanInButtonInMap.classList.add('material-symbols-filled');
        }
    }

    function viewDetails(event) {
        event.preventDefault();

        const target = event.target;

        if (target.tagName == 'BUTTON' && target.dataset.action && target.dataset.action == 'viewdetail') {
            console.log("funciono el evento viewdetail en el mapa");
            console.log(target.dataset.fsqid);
        }
    }

}

loadLocalMapSearchJs();