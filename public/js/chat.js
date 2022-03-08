const socket = io();

// socket.on('countUpdated', (count) => {
//     console.log('the count has been updated!',count)
// })
// document.querySelector('#increment').addEventListener('click',() => {
//     console.log('clicked!');
//     socket.emit('increment');
// })
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');

const $messageTemplate = document.querySelector('#message-template').innerHTML;
const $locationTemplate = document.querySelector('#location-message-template').innerHTML;
const $sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//Query string
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix : true })
const autoscroll = () => {
    //new message element
    const $newMessage = $messages.lastElementChild;

    //height of messages
    const $newMessageStyles = getComputedStyle($newMessage)
    const $newMessageMargin = parseInt($newMessageStyles.marginBottom)
    const $newMessageHieght = $newMessage.offsetHeight + $newMessageMargin
    
    //visible height    
    const $visibleHeight = $messages.offsetHeight

    //height off message container
    const $containerHieght = $messages.scrollHeight

    //how for i have scrolled
    const scrolloffset = $messages.scrollTop + $visibleHeight

    if($containerHieght - $newMessageHieght <= scrolloffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render($messageTemplate,{ 
        username : message.username,
        message : message.text,
        createdAt : moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend',html);
    autoscroll()
})
socket.on('locationMessage',(message) => {
    const html = Mustache.render($locationTemplate,{
        username : message.username,
        url:message.url,
        createdAt:moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend',html);
    autoscroll()
})
$messageForm.addEventListener('submit',(e) => {
    e.preventDefault();
    //disable 
    $messageFormButton.setAttribute('disabled','disabled');
    // const message = document.getElementById('message').value;
    const message = e.target.elements.message.value;
    socket.emit('sendMessage',message,(error) => {
        //enable
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = '';
        $messageFormInput.focus();
        if(error){
            return console.log(error)
        }
        console.log('Message is Delevired!');
    });
})
$sendLocationButton.addEventListener('click', () => {
    if(!navigator.geolocation){
        return alert('Geaolocation is not supported by your browser!')
    }
    $sendLocationButton.setAttribute('disabled','disabled');
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation',{
            latitude:position.coords.latitude,
            longitude:position.coords.longitude
        },
        () => {
            console.log('Location shared!');
            $sendLocationButton.removeAttribute('disabled');
        })
    })

})

socket.emit('join',({username,room}),(error) => {
    if(error){
        alert(error)
        location.href = '/'
    }
});

socket.on('roomData', ( {room,users} ) => {
    const html = Mustache.render($sidebarTemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html;
})