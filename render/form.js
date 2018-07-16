const {ipcRenderer: ipc, remote} = require('electron');
const currentWindow = remote.getCurrentWindow();

let patterns = {
    'TF1': /.*/,
    'Spotify': /spotify:(album|track|artist):.*|((?:https?:)?\/\/)?open.spotify.com\/album\/(.*)/g
};

window.addEventListener('load', function () {
    let $close = document.getElementById('close');
    let $errorNotification = $close.parentNode;
    $close.addEventListener('click', function(){
        $errorNotification.classList.add('hidden');
    });
    if(currentWindow.error){
        $errorNotification.classList.remove('hidden');
        $errorNotification.querySelector('div').innerHTML = currentWindow.error;
    }

    let $form = document.querySelector('form');
    $form.addEventListener('submit', function (e){
        e.preventDefault();
        let $url = $form[0].value;
        let $service = $form[1].value;
        let $width = $form[2].value;
        let $height = $form[3].value;
        let $force = $form[4].checked;
        if($service !== 'Choose Service' && $url.length > 0 && validate($url, $service)){
            $form[5].classList.add('is-loading');
            setTimeout(() => ipc.send('bridge-post', {service: $service, streamURL: $url, size: {width: parseInt($width), height: parseInt($height)}, force: $force}), 250);
        } else {
            if($service === 'Choose Service'){
                $form[1].parentNode.classList.add('is-danger');
            } else {
                $form[1].parentNode.classList.remove('is-danger');
            }
            if($url.length <= 0 || !validate($url, $service)){
                $form[0].classList.add('is-danger');
            } else {
                $form[0].classList.remove('is-danger');
            }
        }
    })
});

function validate(service, url){
    if(patterns[service]){
        return patterns[service].test(url);
    } else {
        return validateURL(url)
    }
}

function validateURL(str) {
    let pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|'+ // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
        '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    return pattern.test(str);
}