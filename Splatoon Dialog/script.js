function substring(string, start, end) {
	if(end < 0) end = string.length + end;
	return string.substring(start, end);
}


const bg = document.getElementById("bg");
const name = document.getElementById("name");
const text = document.getElementById("text");
const color = document.getElementById("color");
const render = document.getElementById("render");

const hero_icon_img = document.createElement("img");

const offsets = {
	width: 0,
	//height: 0,
	x: 0,
	y: 0
};

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
canvas.width = 1860;
canvas.height = 435;

function generate() {
	
	ctx.fillStyle = "transparent";
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	//ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = color.value;
	ctx.fillRect(19, 116, 184, 184);
	const width = 184 + offsets.width;
	ctx.save();
	ctx.beginPath();
	ctx.rect(19, 116, 184, 184);
	ctx.clip();
	try {
		const height = width * hero_icon_img.height / hero_icon_img.width;
		ctx.drawImage(hero_icon_img, 19 - offsets.width/2 + offsets.x, 116 + offsets.y + (184 - height)/2, width, height);
	} catch(e) {}
	ctx.restore();
	ctx.drawImage(bg, 0, 0);
	ctx.font = "75px Paintball";
	ctx.textAlign = "left";
	ctx.textBaseline = "top";
	ctx.fillText(name.value, 25, 7);
	ctx.font = "70px Splatfont2";
	ctx.textBaseline = "middle";
	ctx.textAlign = "center";
	ctx.fillStyle = "white";

	text.value.split("\n").forEach((line, i, lines) => {
		
		ctx.fillText(line, 203 + 775, 89 + (i + 1) * 345 / (lines.length + 1));
	});

	//345

	render.src = canvas.toDataURL();
}


let hero_icon = "";
document.getElementById("icon_file").onchange = function() {
	if(hero_icon != "") try { URL.revokeObjectURL(hero_icon); } catch(e) { }
	hero_icon = URL.createObjectURL(this.files[0]);
	//icon.style.backgroundImage = `url(${hero_icon})`;
	hero_icon_img.src = hero_icon;
}

/*document.getElementById("icon_url").onchange = function() {
	if(hero_icon != "") try { URL.revokeObjectURL(hero_icon); } catch(e) { }
	hero_icon = this.value;
	//icon.style.backgroundImage = `url(${hero_icon})`;
	fetch("https://cdn.discordapp.com/attachments/609526658759655496/612441410792325132/raina_smile.png", { mode: "no-cors"}).then(r => r.blob()).then(r => {
		hero_icon_img.src = hero_icon = URL.createObjectURL(r);
	});
}*/
const hero_icon_img_style = getComputedStyle(hero_icon_img);




for (const key in offsets) {
	if (offsets.hasOwnProperty(key)) {
		document.getElementById(`offset_${key}`).onchange = function() {
			offsets[key] = parseInt(this.value);
		}
	}
}

function update() {
	generate();

	requestAnimationFrame(update);
}
update();