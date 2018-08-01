let rp = {
    'Youtube': ['/embed', ''],
    'Twitch': ['http://player.twitch.tv/?channel=', 'https://twitch.tv/']
};
let cw = require('electron').remote.getCurrentWindow();
let esurl = cw.embedStreamURL;
let psv = cw.providerService;

document.title += ': ' + psv;
document.querySelector('#embed').src = esurl;
document.querySelector('.controls').style.top = cw.offsetY + "px";
if(cw.darkMode) document.querySelectorAll('.controls *').forEach(el => el.classList.add('dark'));
document.querySelector('#open').href = rp[psv] ? esurl.replace(rp[psv][0], rp[psv][1]) : esurl;
document.querySelector('#close').addEventListener('click', () => cw.closeAll());