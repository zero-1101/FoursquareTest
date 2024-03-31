
const ArtsAndEntertainmentId = '10000';
const BusinessAndProfessionalServicesId = '11000';
const CommunityAndGovernmentId = '12000';
const DiningAndDrinkingId = '13000';
const EventId = '14000';
const HealthAndMedicineId = '15000';
const LandmarksAndOutdoorsId = '16000';
const RetailId = '17000';
const SportsAndRecreationId = '18000';
const TravelAndTransportationId = '19000';

function loadLocalMapSearchJs() {
    //mapboxgl.accessToken = 'pk.eyJ1IjoiemVyby1tYXBib3giLCJhIjoiY2x1ZG5vbDBnMDNhZjJqbnR0NTFuajllMSJ9.3X0MCU_HDIT8hNYwn3jQDg';
    const fsqAPIToken = 'fsq3j4GItZknryfDOoi/xnVQXKrUtGvhgbybo+3Ym9fqKH4=';
    let userLat = 40.7128;
    let userLng = -74.0060;
    let sessionToken = generateRandomSessionToken();
    const inputField = document.getElementById('explorer-search');
    const dropDownField = document.getElementById('explorer-dropdown');
    const ulField = document.getElementById('explorer-suggestions');
    const errorField = document.getElementById('explorer-error');
    const notFoundField = document.getElementById('explorer-not-found');

    const sidePanel = document.getElementById('side-panel');

    dropDownField.style.display = 'none';
    sidePanel.style.display = 'none';

    const onChangeAutoComplete = debounce(changeAutoComplete);
    inputField.addEventListener('input', onChangeAutoComplete);

    const toggleResetInputOnExplorerSearch = (e) => {
        if (e.target.value && !inputField.classList.contains("clear-input--touched")) {
            inputField.classList.add("clear-input--touched")
        } else if (!e.target.value && inputField.classList.contains("clear-input--touched")) {
            inputField.classList.remove("clear-input--touched")
        }
    }

    inputField.addEventListener("input", toggleResetInputOnExplorerSearch);

    ulField.addEventListener('click', selectItem);


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

    let isFetching = false;
    async function changeAutoComplete({ target }) {
        const { value: inputSearch = '' } = target;
        ulField.innerHTML = '';
        notFoundField.style.display = 'none';
        errorField.style.display = 'none';
        if (inputSearch.length && !isFetching) {
            try {
                isFetching = true;
                const results = await autoComplete(inputSearch);
                if (results && results.length) {
                    results.forEach((value) => {
                        addItem(value);
                    });
                } else {
                    notFoundField.innerHTML = `Foursquare can't
                find ${inputSearch}. Make sure your search is spelled correctly.  
                <a href="https://foursquare.com/add-place?ll=${userLat}%2C${userLng}&venuename=${inputSearch}"
                  target="_blank" rel="noopener noreferrer">Don't see the place you're looking for?</a>.`;
                    notFoundField.style.display = 'block';
                }
            } catch (err) {
                errorField.style.display = 'block';
                logError(err);
            } finally {
                isFetching = false;
                dropDownField.style.display = 'block';
            }
        } else {
            dropDownField.style.display = 'none';
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
                categories: `${ArtsAndEntertainmentId},${BusinessAndProfessionalServicesId},${CommunityAndGovernmentId},${DiningAndDrinkingId},
                        ${EventId},${HealthAndMedicineId},${LandmarksAndOutdoorsId},${RetailId},${SportsAndRecreationId},${TravelAndTransportationId}`,
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

    function addItem(value) {
        const placeDetail = value[value.type];
        if (!placeDetail || !placeDetail.geocodes || !placeDetail.geocodes.main) return;
        const { latitude, longitude } = placeDetail.geocodes.main;
        const fsqId = placeDetail.fsq_id;
        const dataObject = JSON.stringify({ latitude, longitude, fsqId });
        ulField.innerHTML +=
            `<li class="list-group search-suggestion p-3" data-object='${dataObject}'>
            <div class="pe-none">${highlightedNameElement(value.text)}</div>
            <div class="text-muted pe-none">${value.text.secondary}</div>
          </li>`;
    }

    async function selectItem({ target }) {
        if (target.tagName === 'LI') {
            const valueObject = JSON.parse(target.dataset.object);
            const { latitude, longitude, fsqId } = valueObject;
            const placeDetail = await fetchPlacesDetails(fsqId);
            addMarkerAndPopup(latitude, longitude, placeDetail);
            flyToLocation(latitude, longitude);

            // generate new session token after a complete search
            sessionToken = generateRandomSessionToken();
            const name = target.dataset.name;
            inputField.value = target.children[0].textContent;
            dropDownField.style.display = 'none';
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
        const popupHTML = `<div class="explorer--popup">
            <image class="img-fluid img-thumbnail" src="${photoUrl}" alt="photo of ${name}"/>
            <div class="explorer--popup-description">
              <div class="fw-bold">${name}</div>
              <div class="text-muted">${location.address}</div>
            </div>
            ${rating ? `<div class="explorer--popup-rating">${rating}</div>` : `<div />`}
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
            color: '#3333FF',
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
}

loadLocalMapSearchJs();