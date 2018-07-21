const {ipcRenderer: ipc} = require('electron');

let $submit, $services;
let patterns = {
    //'TF1': /.*/,
    'Spotify': /spotify:(album|track|artist):.*|((?:https?:)?\/\/)?open.spotify.com\/album\/(.*)/g,
    'File': /.*/
};

window.addEventListener('load', function () {
    let $close = document.getElementById('close');
    $services = document.getElementById('services');
    let $errorNotification = $close.parentNode;
    $close.addEventListener('click', function(){
        $errorNotification.classList.add('hidden');
    });
    ipc.on('bridge-error', function(e, error){
        $submit.classList.remove('is-loading');
        document.getElementById('inputURL').classList.add('is-danger');
        $errorNotification.classList.remove('hidden');
        $errorNotification.querySelector('div').innerHTML = error;
    });

    ipc.on('bridge-config-load', function(e, config){
        const categories = ['Default'/*, 'TV Channels'*/, 'Others', 'Experimental'];
        let service, element;
        for (let i = 0; i < categories.length; i++) {
            if(categories[i]){
                if(categories[i] !== 'Default'){
                    element = document.createElement('option');
                    element.setAttribute('disabled', null);
                    element.innerHTML = categories[i];
                    $services.appendChild(element);
                }
                for(service of config[categories[i]]){
                    element = document.createElement('option');
                    element.setAttribute('value', service);
                    element.innerHTML = service;
                    $services.appendChild(element);
                }
            }
        }
        $services.parentNode.classList.remove('is-loading');
    });
    ipc.send('bridge-config');

    let $form = document.querySelector('form');
    $form.addEventListener('submit', function (e){
        e.preventDefault();
        let $url = $form[0].value;
        let $service = $form[1].value;
        let $width = $form[2].value;
        let $height = $form[3].value;
        let $force = $form[4].checked;
        $submit = $form[5];
        if($service !== 'Choose Service' && $url.length > 0 && validate($url, $service) && $width.length > 0 && $width !== '0'
            && $height.length > 0 && $height !== '0'){
            $submit.classList.add('is-loading');
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
            if($width.length <= 0 || $width === '0'){
                $form[2].classList.add('is-danger');
            } else {
                $form[2].classList.remove('is-danger');
            }
            if($height.length <= 0 || $height === '0'){
                $form[3].classList.add('is-danger');
            } else {
                $form[3].classList.remove('is-danger');
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