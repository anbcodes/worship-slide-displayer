const $ = <T extends HTMLElement>(s: string) => {
  const el = document.querySelector(s);
  if (el === null) throw new Error(`Element ${s} not found`);
  return el as T;
}

const VIDEO_TRANSITION_DELAY = 2000;
const TEXT_TRANSITION_DELAY = 250;

let currentLyrics = $<HTMLDivElement>("#current-lyric");
const controls = $<HTMLDivElement>("#controls");
let video = $<HTMLVideoElement>("#background-video");
const renderer = $("#rendered");
const onClick = () => {
  if (renderer.className === '') {
    renderer.className = 'fullscreen'
  } else {
    renderer.className = ''
  }
}
renderer.addEventListener('click', onClick);
let lyricContainer = $("#lyric-container");
// video.addEventListener('click', onClick);

(async () => {


  const information = await (await fetch("/data/metadata.txt")).text();
  // const backgrounds = information.split('---')[0].split('\n').filter(v => v.trim()).map(v => v.split(':').map(v => v.trim()));

  const songs = information.split('\n').filter(v => v.trim()).map(v => v.split(':')).map(v => ({
    name: v[0].trim(),
    background: v[1].split(',')[0].trim(),
    url: v[1].split(',')[1].trim(),
    sections: [] as { name: string; slides: string[]; }[],
  }))

  let loc = {
    song: '',
    section: '',
    slide: 0,
  }

  const ws = new WebSocket(((window.location.protocol === "https:") ? "wss://" : "ws://") + window.location.host + "/ws");

  const renderLoc = (send = true) => {
    const song = songs.find(v => v.name === loc.song)!;
    const slide = song.sections.find(v => v.name === loc.section)!.slides[loc.slide];
    const background = song.background;

    console.log(video, video.src);

    if (!video.src.endsWith(`/data/${background}`)) {
      console.log("Changing to", background);
      const newVideo = video.cloneNode() as HTMLVideoElement;
      newVideo.src = `/data/${background}`;
      video.style.opacity = '0%';
      let id = video.id = `background-video-old-${Math.floor(Math.random() * 2 ** 31)}`;
      newVideo.style.opacity = '0%';
      setTimeout(() => newVideo.style.opacity = '100%', 0);
      renderer.appendChild(newVideo);

      setTimeout(() => {
        console.log("Removing", document.getElementById(id))
        document.getElementById(id)?.remove();
      }, VIDEO_TRANSITION_DELAY);

      video = newVideo;
    }

    const newLyricsContainer = lyricContainer.cloneNode(true) as HTMLDivElement;
    newLyricsContainer.querySelector("#current-lyric")!.innerHTML = slide;
    newLyricsContainer.style.opacity = '0%';

    renderer.appendChild(newLyricsContainer);

    setTimeout(() => newLyricsContainer.style.opacity = '100%', 0);
    lyricContainer.style.opacity = '0%';

    let oldLyricsContainer = lyricContainer;
    setTimeout(() => {
      oldLyricsContainer.remove()
    }, TEXT_TRANSITION_DELAY);
    lyricContainer = newLyricsContainer;

    if (send) ws.send(JSON.stringify(loc));
  }

  ws.addEventListener('message', (ev) => {
    const data = JSON.parse(ev.data);
    loc = data;
    renderLoc(false);
  })


  const containers: HTMLDivElement[] = [];

  songs.forEach(song => {
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = song.name;
    details.appendChild(summary);
    controls.appendChild(details);

    fetch(`/data/${song.url}`).then((res) => res.text()).then((text) => {
      const sections = text.split(/^#/gm).filter(v => v.trim()).map(v => ({
        name: v.split('\n')[0].trim(),
        slides: v.split('\n').slice(1).join('\n').split('\n\n').filter(v => v.trim()).map(v => v.trim().replace(/\n/g, "<br>")),
      }));
      song.sections = sections;
      sections.forEach(sec => {
        const heading = document.createElement('h2');
        heading.textContent = sec.name;
        details.appendChild(heading);

        const slidesContainer = document.createElement('div');
        slidesContainer.className = 'slides';
        sec.slides.forEach((slide, ind) => {
          const container = document.createElement('div');
          container.className = 'slide-control';
          container.innerHTML = slide;
          containers.push(container);
          container.addEventListener('click', () => {
            loc.song = song.name;
            loc.section = sec.name;
            loc.slide = ind;
            renderLoc();
            containers.forEach(v => v.classList.remove('selected'));
            container.classList.add('selected');
          })
          slidesContainer.appendChild(container);
        })

        details.appendChild(slidesContainer);
      })
    })

  })
})();

