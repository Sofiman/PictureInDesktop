(function(){
    let state = {
        mode: 0, // 0: Countdown, 1: Timer
        start: 0, end: 0,
        lastDuration:moment.duration(0, 'milliseconds')
    };
    let $hours = document.querySelector('#hours');
    let $minutes = document.querySelector('#minutes');
    let $seconds = document.querySelector('#seconds');

    function $r(){
        if(state.mode === 0 && state.end >= Date.now()){
            let delta = state.end - Date.now();
            let duration = moment.duration(delta, 'milliseconds');

            if(duration.hours() !== state.lastDuration.hours())
                $hours.innerHTML = h(duration.hours());
            if(duration.minutes() !== state.lastDuration.minutes())
                $minutes.innerHTML = h(duration.minutes());
            if(duration.seconds() !== state.lastDuration.seconds())
                $seconds.innerHTML = h(duration.seconds());

            state.lastDuration = duration;
        } else if(state.mode === 1 && state.start >= 0){
            let delta = Date.now() - state.start;
            let duration = moment.duration(delta, 'milliseconds');

            if(duration.hours() !== state.lastDuration.hours())
                $hours.innerHTML = h(duration.hours());
            if(duration.minutes() !== state.lastDuration.minutes())
                $minutes.innerHTML = h(duration.minutes());
            if(duration.seconds() !== state.lastDuration.seconds())
                $seconds.innerHTML = h(duration.seconds());
            state.lastDuration = duration;
        }
    }

    function setMode(mode, start, end){
        state.mode = mode;
        state.start = start;
        state.end = end;
        $r();
    }

    function h(t){
        t = t.toString();
        if(t.length < 2)
            t = '0' + t;
        return t
    }

    $r();
    setInterval($r, 1000);
    setMode(1, Date.now())
})()