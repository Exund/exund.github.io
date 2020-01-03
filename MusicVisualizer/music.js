/** @type {AudioContext} */
let audioContext;
/** @type {AnalyserNode} */
let analyser;
/** @type {MediaElementAudioSourceNode} */
let track;
/** @type {BiquadFilterNode} */
let biquad_filter;
let bufferLength;
let frequencyByteDataArray = new Uint8Array(0);
let timeDomainByteDataArray = new Uint8Array(0);

/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.onresize = function() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
}

const ctx = canvas.getContext("2d");
/** @type {HTMLAudioElement} */
const audio = document.getElementById("audio");
/** @type {HTMLInputElement} */
const file_input = document.getElementById("file");
file_input.addEventListener("change",LoadSound)
const load_button = document.getElementById("load");
load_button.addEventListener("click",Start);


function LoadSound() {
    audioContext = new AudioContext();
    audio.src = URL.createObjectURL(file_input.files[0]);
    audio.load();
    track = audioContext.createMediaElementSource(audio);
	analyser = audioContext.createAnalyser();
	track.connect(analyser);
	/*biquad_filter = audioContext.createBiquadFilter();
	track.connect(biquad_filter);
	biquad_filter.connect(analyser);*/
    analyser.connect(audioContext.destination);
	analyser.fftSize = 512;
	
	/*biquad_filter.type = "allpass";
	biquad_filter.frequency.setValueAtTime(0, 0);
	biquad_filter.detune.value = 0;
	biquad_filter.Q.value = 0;*/

    /*frequencyByteDataArray = new Uint8Array(analyser.frequencyBinCount);
    timeDomainByteDataArray = new Uint8Array(analyser.frequencyBinCount);*/
}
let min_height = 30;

let round_wave = true;
let bar_freq = false;
let repeat = 1;
let mirror = false;
let fill = false;
let bounce = false;
let invert = false;
let start_angle = 0;

let prev_mean = 0;

let timer;
let background_color = "#000";
let strokeStyle = "#fff";

let coloring_type = 0;

let coloring = [
    (size, index, array_length) => {
        size = Math.max(size, 1);
        return "#"+("0"+size.toString(16)).substr(-2)+("0"+(255-size).toString(16)).substr(-2)+("0"+Math.round((index%array_length)/array_length*255).toString(16)).substr(-2);
    },
    (size, index, array_length) => {
        size = Math.max(size, 1);
        return "#"+("0"+(255-size).toString(16)).substr(-2)+("0"+size.toString(16)).substr(-2)+("0"+Math.round((index%array_length)/array_length*255).toString(16)).substr(-2);
    },
    (size, index, array_length) => {
        size = Math.max(size, 1);
        return "#"+("0"+Math.round((index%array_length)/array_length*255).toString(16)).substr(-2)+("0"+(255-size).toString(16)).substr(-2)+("0"+size.toString(16)).substr(-2);
	},

	(size, index, array_length) => {
        size = Math.max(size, 1);
        return "#"+("0"+size.toString(16)).substr(-2)+("0"+Math.round((index%array_length)/array_length*255).toString(16)).substr(-2)+("0"+(255-size).toString(16)).substr(-2);
    },
    (size, index, array_length) => {
        size = Math.max(size, 1);
        return "#"+("0"+(255-size).toString(16)).substr(-2)+("0"+Math.round((index%array_length)/array_length*255).toString(16)).substr(-2)+("0"+size.toString(16)).substr(-2);
    },
    (size, index, array_length) => {
        size = Math.max(size, 1);
        return "#"+("0"+Math.round((index%array_length)/array_length*255).toString(16)).substr(-2)+("0"+size.toString(16)).substr(-2)+("0"+(255-size).toString(16)).substr(-2);
    },
    (size, index, array_length) => {
        return "#"+("0"+size.toString(16)).substr(-2).repeat(3);
	},
	(size, index, array_length) => {
		let angle = Math.PI * 2 * (index + audio.currentTime / audio.duration * array_length) / array_length;
		return `hsl(${angle}rad, ${Math.min(((size / 255) * 100 + 50), 100)}%, 50%)`;
	},
	(size, index, array_length) => {
		return `hsl(${size / 255 * Math.PI * 2}rad, 100%, 50%)`;
	},
	(size, index, array_length) => {
		return `hsl(${(255 - size / 255) * Math.PI * 2}rad, 100%, 50%)`;
	},
	(size, index, array_length) => {
		return `hsl(${((audio.currentTime / audio.duration * 255 + size) % 256) / 255 * Math.PI * 2}rad, 100%, 50%)`;
	}
    //() => "#"+("0"+Math.round(Math.random()*255).toString(16)).substr(-2)+("0"+Math.round(Math.random()*255).toString(16)).substr(-2)+("0"+Math.round(Math.random()*255).toString(16)).substr(-2)
];

ctx.lineJoin = 'round';
function Start() {
    clearInterval(timer);
    audio.play();
    timer = setInterval(() => {
		frequencyByteDataArray = new Uint8Array(analyser.frequencyBinCount);
    	timeDomainByteDataArray = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(frequencyByteDataArray);
		analyser.getByteTimeDomainData(timeDomainByteDataArray);

        ctx.fillStyle = background_color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        //frequencyByteDataArray = frequencyByteDataArray.filter(v => v >= min_freq);

        let barWidth = (canvas.width / (frequencyByteDataArray.length * repeat));
        let barHeight;
        let incr = Math.PI * 2 / (frequencyByteDataArray.length * repeat);
        let angle = Math.PI + (mirror ? incr/2 : 0) + start_angle;
		let x0, y0;
		let px, py;
        let bx = 0;      
        let mean = 0;

        for(var i = 0; i < frequencyByteDataArray.length * repeat; i++) {
			
          	barHeight = mirror && i >= frequencyByteDataArray.length*repeat/2 ? frequencyByteDataArray[frequencyByteDataArray.length-(i%frequencyByteDataArray.length + 1)] : frequencyByteDataArray[i%frequencyByteDataArray.length];
			
			if(bar_freq) {
				ctx.fillStyle = coloring[coloring_type](barHeight, i, frequencyByteDataArray.length);//"#"+("0"+Math.round((i%frequencyByteDataArray.length)/frequencyByteDataArray.length*255).toString(16)).substr(-2)+("0"+(255-barHeight).toString(16)).substr(-2)+("0"+barHeight.toString(16)).substr(-2);
				ctx.fillRect(bx,canvas.height-barHeight,barWidth,barHeight);
				bx+=barWidth;
			}
            
            ctx.fillStyle = ctx.strokeStyle = coloring[coloring_type](barHeight, i, frequencyByteDataArray.length);

			barHeight += bounce ? prev_mean : 0;
			barHeight = Math.max(min_height, barHeight);

			if(invert) barHeight = 255 - barHeight;
			ctx.beginPath();
			let x = canvas.width/2 + Math.sin(angle) * (barHeight / (255 + (bounce ? prev_mean : 0))) * Math.min(canvas.height,canvas.width)/2;
			let y = canvas.height/2 + Math.cos(angle) * (barHeight / (255 + (bounce ? prev_mean : 0))) * Math.min(canvas.height,canvas.width)/2;

			if (i == 0) {
				[x0, y0] = [x, y];
            } else {
				ctx.moveTo(px, py);
                ctx.lineTo(x, y);
                if(fill) {
                    ctx.lineTo(canvas.width/2, canvas.height/2);
                    ctx.fill();
                    ctx.lineWidth = 1;
                }
                ctx.stroke();        
			}
			[px, py] = [x, y];
            angle += incr;
            if(i < frequencyByteDataArray.length) mean+=frequencyByteDataArray[i];
        }
		mean = mean/frequencyByteDataArray.length;
		prev_mean = mean;
		ctx.beginPath();
		ctx.moveTo(px, py);
        ctx.lineTo(x0, y0);
        if(fill) {
            ctx.lineTo(canvas.width/2, canvas.height/2);
            ctx.fill();
        }
        ctx.stroke();

        ctx.strokeStyle = "#eee";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(canvas.width/2, canvas.height/2, (mean / 255) * Math.min(canvas.height,canvas.width)/2, 0, 2 * Math.PI);
        ctx.stroke();

		

        ctx.lineWidth = 2;
        ctx.strokeStyle = strokeStyle;
        ctx.beginPath();

		let sliceWidth = canvas.width / timeDomainByteDataArray.length;

		angle = 0;
        incr = Math.PI * 2 / timeDomainByteDataArray.length;
        let x = 0;
        for (let i = 0; i < timeDomainByteDataArray.length; i++) {

            let v = timeDomainByteDataArray[i];
            //let y = v * canvas.height / 2;
			x = round_wave ? canvas.width/2 + Math.sin(angle) * v/2 : x;
			let y = round_wave ? canvas.height/2 + Math.cos(angle) * v/2 : v/128 * canvas.height / 2;

            if (i === 0) {
				ctx.moveTo(x, y);
				[x0, y0] = [x, y];
            } else {
                ctx.lineTo(x, y);
			}
			
			if(!round_wave) x += sliceWidth;
			angle += incr;
        }
		//ctx.lineTo(canvas.width, canvas.height / 2);
		if(round_wave) ctx.lineTo(x0, y0);
        ctx.stroke();
    },1000/240);
}

/*window.onload = function		timeDomainByteDataArray.() {
  
    var file = document.getElementById("thefile");
    var 
    

      var files = this.files;
      audio.src = URL.createObjectURL(files[0]);
      audio.load();
      audio.play();
      var context = new AudioContext();
      var src = context.createMediaElementSource(audio);
      var analyser = context.createAnalyser();
  
      var canvas = document.getElementById("canvas");
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      var ctx = canvas.getContext("2d");
  
      src.connect(analyser);
      analyser.connect(context.destination);
  
      analyser.fftSize = 256;
  
      var bufferLength = analyser.frequencyBinCount;
      console.log(bufferLength);
  
      var dataArray = new Uint8Array(bufferLength);
  
      var WIDTH = canvas.width;
      var HEIGHT = canvas.height;
  
      var barWidth = (WIDTH / bufferLength) * 2.5;
      var barHeight;
      var x = 0;
  
      function renderFrame() {
        requestAnimationFrame(renderFrame);
  
        x = 0;
  
        analyser.getByteFrequencyData(dataArray);
  
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
        for (var i = 0; i < bufferLength; i++) {
          barHeight = dataArray[i];
          
          var r = barHeight + (25 * (i/bufferLength));
          var g = 250 * (i/bufferLength);
          var b = 50;
  
          ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
          ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);
  
          x += barWidth + 1;
        }
      }
  
      audio.play();
      renderFrame();
    };
  };*/