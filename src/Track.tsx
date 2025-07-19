import {useEffect, useState} from "react";
// import track from '/public/assets/track.svg?raw';

function TrackComponent({QUOTA}){

    const [trackSVG, setTrackSVG] = useState<string>('');

    useEffect(() => {
        console.log('In track useeffect');
        fetch('/assets/track.svg').then(response => response.text()).then(template => {
            const populated = template.replace('{{QUARTER}}', `$${(QUOTA * 0.25 / 1000).toFixed(1)}K`)
                .replace('{{HALF}}', `$${(QUOTA * 0.50 / 1000).toFixed(1)}K`)
                .replace('{{THREEQ}}', `$${(QUOTA * 0.75 / 1000).toFixed(1)}K`)
                .replace('{{FINISH}}', '$' + QUOTA.toString() + 'K');
            setTrackSVG(populated);
            console.log(JSON.stringify(populated));
        }).catch(err => {console.log('Track did not template correctly: ',err);});
    },[QUOTA]);

    return <div dangerouslySetInnerHTML={{__html: trackSVG}}/>
}

export default TrackComponent;