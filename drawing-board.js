import { html, LitElement, css, unsafeCSS } from "lit-element";
import 'regenerator-runtime/runtime'
import TinyBrushAction from "./img/tiny-brush1.png";

export class DrawingBoard extends LitElement{

    static get properties(){
        return {
            loaded: {
                type: Boolean
            }
        }
    }

    
    static get styles(){
        return css `
            :host{
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                background-color: lightskyblue;
                width: 100vw;
                height: 100%;
                overflow: hidden;
                
            }
            
            #middle {
                display: flex;
                
            }
            
            canvas {
                background-color: white;
                z-index: 1;
                cursor: url(${unsafeCSS(TinyBrushAction)}), default;
        }
        .colors, .backgrounds, .brush {
            border: 2px solid transparent;
            width: 3rem;
            height: 3rem;
            margin: .3rem 1rem;
            cursor: pointer;
        }
        
        #colors, #backgrounds, #strokes {
            z-index: 1;
            display: flex;
            flex-direction: column-reverse;
            justify-content: center;
            align-items: center;
            
        }

        .colors, .brush {
            border-radius: 50%;
        }

        .active {
            border: 2px solid limegreen;
        }

        #clear {
         background-color: white;
         font-family: Calibri, sans-serif;
        }
        h1, #bottom>button, #bottom>a {
          font-family: "Permanent Marker", cursive;  
        }

        #bottom>button, #bottom>a, .un {
            background: none;
            border: none;
            margin-top: .2rem;
            outline: none;
        }
        .un {
            font-size: 2rem;
            margin-bottom: 4rem;
        }
        #bottom>button:hover, .un:hover, a:hover {
            background-color: white;
            cursor: pointer;
        }

        #bottom>button, #bottom>a {
            margin-left: 6rem;
        }
        
        a:active, a:visited, a:link{
            color: black;
            text-decoration: none;
        }

        @media only screen and (max-width: 1000px) {
            :host {
                overflow: hidden;
            }
            h1 {
                font-size: 400%;
                margin-top: -3rem;
            }
            a, button {
                font-size: 200%;
            }
        }
`
    }

    constructor(){
        super();
        this.canvas;
        this.prevX;
        this.prevY;
        this.newX;
        this.newY;
        this.ctx;
        this.color = "black";
        this.background = "white";
        this.stroke = 1;
        this.colors = ["#ff8888", "#ffdda8", "#f9ff93", "#d5ffb5", "#b3fdff", "purple", "black", "white"];
        this.brushes = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        this.points = [];
        this.lastPoint;
    }
    firstUpdated(){
        super.firstUpdated();
        if((typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1)){
            this.brushes = [20, 30, 40, 50, 60, 70, 80, 90];
            this.requestUpdate();
        }
        console.log(this.brushes);
        this.canvas = this.shadowRoot.querySelector("canvas");
        this.canvas.style.backgroundColor = this.background;
        this.ctx = this.canvas.getContext("2d");
        this.canvas.width = window.innerWidth * 0.7;
        this.canvas.height = window.innerHeight * 0.7;
    }
    
    pickColor(e) {
        Array.from(this.shadowRoot.querySelectorAll(".colors")).map(el => {
            el.classList.remove("active");
        })
        e.target.classList.add("active");
        this.color = e.target.value;
        this.requestUpdate();
    }
    pickBg(e) {
        Array.from(this.shadowRoot.querySelectorAll(".backgrounds")).map(el => {
            el.classList.remove("active");
        })
        e.target.classList.add("active");
        this.background = e.target.value;
        this.canvas.style.backgroundColor = this.background;
        this.requestUpdate();
    }
    
    pickBrush(e) {        
        Array.from(this.shadowRoot.querySelectorAll(".brush")).map(el => {
            el.style.borderColor = "transparent";
        })
        e.target.style.borderColor = "black";
        this.stroke = e.target.value;
        this.requestUpdate();
    }

    trackMouse(e) {
        this.prevX = e.offsetX;
        this.prevY = e.offsetY;
        this.ctx.beginPath();
        this.ctx.moveTo(this.prevX, this.prevY);
        this.points.push({
            x: e.offsetX,
            y: e.offsetY,
            stroke: this.stroke,
            color: this.color,
            mode: "begin"
        });
        this.canvas.onmousemove = this.drawMouse.bind(this);
    }
    
    track(e){
        e.preventDefault();
        e.stopPropagation();
        this.prevX = e.touches[0].pageX - e.touches[0].target.offsetLeft;
        this.prevY = e.touches[0].pageY - e.touches[0].target.offsetTop;;
        this.ctx.beginPath();
        this.ctx.moveTo(this.prevX, this.prevY);
        this.points.push({
            x: e.offsetX,
            y: e.offsetY,
            stroke: this.stroke,
            color: this.color,
            mode: "begin"
        });
        this.canvas.ontouchmove = this.draw.bind(this);
    }

    stopMouse(){
        this.canvas.onmousemove = null;
        this.points.push({
            x: this.newX,
            y: this.newY,
            stroke: this.stroke,
            color: this.color,
            mode: "end"
        });
        this.requestUpdate();
    }
    
    stop(){
        this.points.push({
            x: this.newX,
            y: this.newY,
            stroke: this.stroke,
            color: this.color,
            mode: "end"
        });
        this.canvas.ontouchmove = null;
        this.requestUpdate();
    }

    undo(){
        if(this.points.length > 0){
        this.lastPoint = this.points.pop();
        this.drawAll();
        }
    }
    
    redo(){
        this.points.unshift(this.lastPoint);
        this.drawAll();
    }

    drawAll(){
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for(const point of this.points) {
            if(point.mode == "begin"){
                this.ctx.beginPath();
                this.ctx.moveTo(point.x, point.y);
            }
            else if(point.mode == "draw"){
            this.ctx.lineTo(point.x, point.y);
            this.ctx.strokeStyle = point.color;
            this.ctx.lineWidth = point.stroke;
            }
            else if(point.mode == "end"){
            this.ctx.stroke();
            }
        }
        console.log(this.points);
        this.requestUpdate();
    }
    
    drawMouse(e) {
        this.newX = e.offsetX;
        this.newY = e.offsetY;
        this.ctx.lineTo(this.newX, this.newY);
        this.ctx.strokeStyle = this.color;
        this.ctx.lineWidth = this.stroke;
        this.ctx.stroke();
        this.points.push({
            x: e.offsetX,
            y: e.offsetY,
            stroke: this.stroke,
            color: this.color,
            mode: "draw"
        });
       
    }

    draw(e) {
        e.preventDefault();
        e.stopPropagation();
        this.newX = e.touches[0].pageX - e.touches[0].target.offsetLeft;
        this.newY = e.touches[0].pageY - e.touches[0].target.offsetTop;
        this.ctx.lineTo(this.newX, this.newY);
        this.ctx.strokeStyle = this.color;
        this.ctx.lineWidth = this.stroke;
        this.ctx.stroke();
    }

    clear(){
        if(window.confirm("Are you sure you want to delete your masterpiece?")){
            this.background = "white";
            this.canvas.style.backgroundColor = this.background;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.requestUpdate();
        }
    }

    save(){
        const link = this.shadowRoot.querySelector('#link');
        link.setAttribute('download', 'My Masterpiece.png');
        link.setAttribute('href', this.canvas.toDataURL("image/png").replace("image/png", "image/octet-stream"));
    }
    


    render(){
        return html`
        <div id="top">
            <h1>Draw a masterpiece!</h1>
        </div>
        <div id="middle">
        <div id="backgrounds">
            ${this.colors.map(color=>{
                return html `<button value="${color}" class="${this.background === color ? `active backgrounds` : `backgrounds`}" @click="${this.pickBg}" style="background-color: ${color}"></button>`})}
       <button class="un" @click="${this.undo}"> &larr;</button>
    </div>
    <div id="colors">
        ${this.colors.map(color=>{
            return html `<button value="${color}" class="colors" @click="${this.pickColor}" style="background-color: ${color}"></button>`})}
            <button class='un' @click="${this.redo}"> &rarr;</button>
        </div>
        <canvas @touchstart="${this.track}" @mousedown="${this.trackMouse}" @mouseup="${this.stopMouse}"  @touchend="${this.stop}"></canvas>
        <div id="strokes">
        ${this.brushes.map(brush=>{
           return html `<button value="${brush}" class="brush" @click="${this.pickBrush}" style="width: 1.${brush}9rem; height: 1.${brush}9rem; background-color: ${this.color}"></button>`})}
        </div>
        </div>
       <div id="bottom">
       <button @click="${this.clear}">clear canvas</button>
        <a id="link" @click="${this.save}">save masterpiece</a>   
        </div>
      
        `
}}
customElements.define("drawing-board", DrawingBoard);