// js/renderer.js – Main controller: DOM wiring, canvas setup, rendering (WIP)

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('video-canvas');
    const dslInput = document.getElementById('dsl-input');
    const playBtn = document.getElementById('play-btn');

    // Set canvas size later when we have resolution from DSL

    playBtn.addEventListener('click', () => {
        const rawJson = dslInput.value.trim();
        if (!rawJson) {
            alert('Paste your JSON DSL first!');
            return;
        }

        let videoData;
        try {
            videoData = parseDSL(rawJson); // from parser.js
        } catch (error) {
            alert(error.message);
            console.error(error);
            return;
        }

        console.log('Parsed video:', videoData);

        // TODO: Next steps will be built here:
        // - initCanvas(videoData.resolution)
        // - buildSceneTimeline(ctx, scene) for each scene
        // - playVideo(videoData, canvas)
        alert('Parsing successful! Check the console. Rendering not yet implemented.');
    });
});