Math.TAU = Math.PI * 2;

/**
 * @template T
 * @param {T} obj
 * @returns {T & EventTarget}
 */
function createEventProxy(obj) {
    const et = new EventTarget();
    et.addEventListener = et.addEventListener.bind(et);
    et.removeEventListener = et.removeEventListener.bind(et);
    et.dispatchEvent = et.dispatchEvent.bind(et);

    return new Proxy(Object.assign(et, obj), {
        set: function (target, key, value) {
            if (typeof target[key] !== "function" && target[key] !== value) {
                target[key] = value;
                target.dispatchEvent(new CustomEvent(key, { detail: value }));
            }

            return true;
        }
    });
}

const settings_target = {
    min_height: 30,
    waveform: true,
    round_wave: true,
    bars: false,
    repeat: 1,
    mirror: false,
    fill: false,
    bounce: false,
    invert: false,
    start_angle: 0,
    coloring_type: 0,
    frequency: 9,
    freq_percentage: 2 / 3,
}

const settings = createEventProxy(settings_target);

settings.addEventListener("coloring_type", e => {
    draw_data.color_function = coloring[Math.max(0, Math.min(coloring.length - 1, e.detail))];
});

settings.addEventListener("frequency", e => {
    if (audio_data.analyser) {
        audio_data.analyser.fftSize = 2 ** e.detail;
        audio_data.frequencies = new Uint8Array(audio_data.analyser.frequencyBinCount);
        audio_data.waveform = new Uint8Array(audio_data.analyser.frequencyBinCount);
    }
});

settings.addEventListener("mirror", recalculate_draw_data);
settings.addEventListener("repeat", recalculate_draw_data);
settings.addEventListener("freq_percentage", recalculate_draw_data);
settings.addEventListener("start_angle", () => {
    draw_data.initial_angle = Math.PI + (settings.mirror ? draw_data.incr / 2 : 0) + settings.start_angle;
});


const audio_data_target = {
    /** @type {AnalyserNode} */
    analyser: null,

    frequencies: new Uint8Array(0),
    waveform: new Uint8Array(0),
};

const audio_data = createEventProxy(audio_data_target);

audio_data.addEventListener("frequencies", recalculate_draw_data);

const canvas_data = {
    mx: 0,
    my: 0,

    min_dim: 0,
    half_min_dim: 0,
};

function hexcolor(rgb) {
    return "#" + rgb.map(c => c.toString(16).padStart(2, "0")).join("");
}

function rgbcolor(rgb) {
    return "rgb(" + rgb.map(c => Math.round(c)).join(",") + ")";
}

const coloring = /*[
    (size, index, array_length) => {
        size = Math.max(size, 1);
        return "#" + ("0" + size.toString(16)).substr(-2) + ("0" + (255 - size).toString(16)).substr(-2) + ("0" + Math.round((index % array_length) / array_length * 255).toString(16)).substr(-2);
    },
    (size, index, array_length) => {
        size = Math.max(size, 1);
        return "#" + ("0" + (255 - size).toString(16)).substr(-2) + ("0" + size.toString(16)).substr(-2) + ("0" + Math.round((index % array_length) / array_length * 255).toString(16)).substr(-2);
    },
    (size, index, array_length) => {
        size = Math.max(size, 1);
        return "#" + ("0" + Math.round((index % array_length) / array_length * 255).toString(16)).substr(-2) + ("0" + (255 - size).toString(16)).substr(-2) + ("0" + size.toString(16)).substr(-2);
    },
    (size, index, array_length) => {
        size = Math.max(size, 1);
        return "#" + ("0" + size.toString(16)).substr(-2) + ("0" + Math.round((index % array_length) / array_length * 255).toString(16)).substr(-2) + ("0" + (255 - size).toString(16)).substr(-2);
    },
    (size, index, array_length) => {
        size = Math.max(size, 1);
        return "#" + ("0" + (255 - size).toString(16)).substr(-2) + ("0" + Math.round((index % array_length) / array_length * 255).toString(16)).substr(-2) + ("0" + size.toString(16)).substr(-2);
    },
    (size, index, array_length) => {
        size = Math.max(size, 1);
        return "#" + ("0" + Math.round((index % array_length) / array_length * 255).toString(16)).substr(-2) + ("0" + size.toString(16)).substr(-2) + ("0" + (255 - size).toString(16)).substr(-2);
    },
    (size, index, array_length) => {
        return "#" + ("0" + size.toString(16)).substr(-2).repeat(3);
    },
    (size, index, array_length) => {
        let angle = Math.TAU * (index + audio.currentTime / audio.duration * array_length) / array_length;
        return `hsl(${angle}rad, ${Math.min(((size / 255) * 100 + 50), 100)}%, 50%)`;
    },
    (size, index, array_length) => {
        return `hsl(${size / 255 * Math.TAU}rad, 100%, 50%)`;
    },
    (size, index, array_length) => {
        return `hsl(${(255 - size / 255) * Math.TAU}rad, 100%, 50%)`;
    },
    (size, index, array_length) => {
        return `hsl(${((audio.currentTime / audio.duration * 255 + size) % 256) / 255 * Math.TAU}rad, 100%, 50%)`;
    }
    //() => "#"+("0"+Math.round(Math.random()*255).toString(16)).substr(-2)+("0"+Math.round(Math.random()*255).toString(16)).substr(-2)+("0"+Math.round(Math.random()*255).toString(16)).substr(-2)
];*/
    [
        (size, index, array_length) => {
            size = Math.max(size, 1);
            return hexcolor([size, 255 - size, Math.round((index % array_length) / array_length * 255)]);
        },
        (size, index, array_length) => {
            size = Math.max(size, 1);
            return hexcolor([255 - size, size, Math.round((index % array_length) / array_length * 255)]);
        },
        (size, index, array_length) => {
            size = Math.max(size, 1);
            return hexcolor([Math.round((index % array_length) / array_length * 255), 255 - size, size]);
        },
        (size, index, array_length) => {
            size = Math.max(size, 1);
            return hexcolor([size, Math.round((index % array_length) / array_length * 255), 255 - size]);
        },
        (size, index, array_length) => {
            size = Math.max(size, 1);
            return hexcolor([255 - size, Math.round((index % array_length) / array_length * 255), size]);
        },
        (size, index, array_length) => {
            size = Math.max(size, 1);
            return hexcolor([Math.round((index % array_length) / array_length * 255), size, 255 - size]);
        },
        (size, index, array_length) => {
            return "#" + ("0" + size.toString(16)).substr(-2).repeat(3);
        },
        (size, index, array_length) => {
            let angle = Math.TAU * (index + audio.currentTime / audio.duration * array_length) / array_length;
            return `hsl(${angle}rad, ${Math.min(((size / 255) * 100 + 50), 100)}%, 50%)`;
        },
        (size, index, array_length) => {
            return `hsl(${size / 255 * Math.TAU}rad, 100%, 50%)`;
        },
        (size, index, array_length) => {
            return `hsl(${(255 - size / 255) * Math.TAU}rad, 100%, 50%)`;
        },
        (size, index, array_length) => {
            return `hsl(${((audio.currentTime / audio.duration * 255 + size) % 256) / 255 * Math.TAU}rad, 100%, 50%)`;
        }
    ];

const draw_data = {
    repeat_freq_length: 0,
    barWidth: 0,
    incr: 0,
    initial_angle: 0,
    sliceWidth: 0,

    /**
     * @type {(size: number, index: number, array_length: number) => string}
     */
    color_function: coloring[0],
}

function recalculate_draw_data() {
    const repeat_freq_length = Math.floor(audio_data.frequencies.length * settings.repeat * settings.freq_percentage);
    const incr = Math.TAU / repeat_freq_length;

    Object.assign(draw_data, {
        repeat_freq_length,
        barWidth: canvas.width / repeat_freq_length,
        incr,
        initial_angle: Math.PI + (settings.mirror ? incr / 2 : 0) + settings.start_angle,
        sliceWidth: canvas.width / audio_data.waveform.length,
    });
}

document.querySelectorAll("input[type=checkbox]").forEach(/** @param {HTMLInputElement} c */ c => {
    const id = c.id;
    if (settings.hasOwnProperty(id)) {
        c.addEventListener("change", e => {
            settings[id] = e.target.checked;
        });
    }
});

document.querySelectorAll("input[type=number]").forEach(n => {
    const id = n.id;
    if (settings.hasOwnProperty(id)) {
        n.addEventListener("input", e => {
            settings[id] = parseFloat(e.target.value);
        });
    }
});

/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

window.addEventListener("resize", () => {
    recalculate_canvas_data();
    recalculate_draw_data();
});

function recalculate_canvas_data() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    canvas_data.half_min_dim = (canvas_data.min_dim = Math.min(canvas.width, canvas.height)) / 2;
    canvas_data.mx = canvas.width / 2;
    canvas_data.my = canvas.height / 2;
}

recalculate_canvas_data();


/** @type {HTMLAudioElement} */
const audio = document.getElementById("audio");

/** @type {HTMLInputElement} */
const file_input = document.getElementById("file");
file_input.addEventListener("change", () => {
    audio.src = URL.createObjectURL(file_input.files[0]);
    audio.load();

    if(!audio_data.analyser) {
        const audioContext = new AudioContext();
        const track = audioContext.createMediaElementSource(audio);
        const analyser = audioContext.createAnalyser();
        track.connect(analyser);
        analyser.connect(audioContext.destination);
        analyser.fftSize = 2 ** settings.frequency;
        audio_data.analyser = analyser;
    }

    audio_data.waveform = new Uint8Array(audio_data.analyser.frequencyBinCount);
    audio_data.frequencies = new Uint8Array(audio_data.analyser.frequencyBinCount);

    Start();
});

window.addEventListener("drop", e => {
    file_input.files = e.dataTransfer.files || [e.dataTransfer.items[0].getAsFile()];
    e.preventDefault();

    file_input.dispatchEvent(new Event("change"));
});

window.ondragend = window.ondragover = e => {
    e.preventDefault();
};


const load_button = document.getElementById("load");
load_button.addEventListener("click", Start);


let prev_mean = 0;

let timer;
let background_color = "#000";
let strokeStyle = "#fff";

ctx.lineJoin = "round";

function Start() {
    clearInterval(timer);
    audio.play();
    timer = setInterval(draw, 1000 / 60);
}

function draw() {
    const {
        min_height,
        bars,
        mirror,
        fill,
        bounce,
        invert,
    } = settings;

    const { frequencies, waveform, analyser } = audio_data;

    ctx.lineWidth = 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    analyser.getByteFrequencyData(frequencies);
    analyser.getByteTimeDomainData(waveform);

    const freq_length = Math.floor(frequencies.length * settings.freq_percentage);

    const { barWidth, color_function, incr, initial_angle, repeat_freq_length } = draw_data;

    let angle = initial_angle;
    let x0, y0;
    let px, py;
    let mean = 0;
    let bx = 0;

    const { mx, my, half_min_dim } = canvas_data;

    ctx.save();
    ctx.translate(mx, my);
    
    for (var i = 0; i < repeat_freq_length; i++) {
        let barHeight;

        if (mirror && i >= repeat_freq_length / 2) {
            barHeight = frequencies[freq_length - (i % freq_length + 1)];
        } else {
            barHeight = frequencies[i % freq_length];
        }

        ctx.fillStyle = ctx.strokeStyle = color_function(barHeight, i, freq_length);

        if (bars) {
            ctx.fillRect(bx - 0.5 - mx, canvas.height - barHeight - my, barWidth + 0.5, barHeight);
            bx += barWidth;
        }

        if (bounce) {
            barHeight += prev_mean;
        }

        barHeight = Math.max(min_height, barHeight);

        if (invert) {
            barHeight = 255 - barHeight;
        }

        ctx.beginPath();

        const mult = (barHeight / (255 + (+bounce * prev_mean))) * half_min_dim
        let x = Math.sin(angle) * mult;
        let y = Math.cos(angle) * mult;

        if (i == 0) {
            [x0, y0] = [x, y];
        } else {
            ctx.moveTo(px, py);
            ctx.lineTo(x, y);
            if (fill) {
                ctx.lineTo(0, 0);
                ctx.fill();
                ctx.stroke();
            }
            ctx.stroke();
        }

        [px, py] = [x, y];
        angle += incr;

        if (i < freq_length) {
            mean += frequencies[i];
        }
    }

    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(x0, y0);
    if (fill) {
        ctx.lineTo(0, 0);
        ctx.fill();
    }
    ctx.stroke();
    ctx.restore();

    mean /= freq_length;
    prev_mean = mean;

    ctx.strokeStyle = "#eee";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(mx, my, mean / 255 * half_min_dim, 0, 2 * Math.PI);
    ctx.stroke();

    if (settings.waveform) {
        draw_wave();
    }
}


function draw_wave() {
    const { waveform } = audio_data;
    const { mx, my } = canvas_data;

    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = strokeStyle;

    let angle = 0;
    let incr = Math.TAU / waveform.length;

    if (settings.round_wave) {
        ctx.translate(mx, my);
        ctx.beginPath();

        for (let i = 0; i < waveform.length; i++) {
            let v = waveform[i] / 2;

            let x = Math.sin(angle) * v;
            let y = Math.cos(angle) * v;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

            angle += incr;
        }

        ctx.closePath();
    } else {
        let x = 0;
        ctx.translate(0, my);
        for (let i = 0; i < waveform.length; i++) {
            let y = (waveform[i] - 128) / 128 * my;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            x += draw_data.sliceWidth;
            angle += incr;
        }
    }

    ctx.stroke();
    ctx.restore();
}