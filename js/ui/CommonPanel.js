class CommonPanel extends EventTarget
{
    constructor(title)
    {
        super();

        this.mainDiv = document.createElement("div");

        this.title = document.createElement("p");
        this.title.innerText = title;

        this.titleDiv = document.createElement("div");
        this.titleDiv.append(this.title);

        this.contentDiv = document.createElement("div");

        this.mainDiv.append(this.titleDiv, this.contentDiv);
    }

    hide()
    {
        // console.log("CommonPanel hide()", this.display, this.mainDiv.style.display);

        this.display = this.mainDiv.style.display;

        this.mainDiv.style.display = "none";
    }

    isShowing()
    {
        return this.mainDiv.style.display !== "none";
    }

    move(x, y)
    {
        const leftSide = x < (this.mainDiv.parentNode.offsetWidth / 2);
        const rect = this.mainDiv.getBoundingClientRect();
        const vOffset = rect.height * y / this.mainDiv.parentNode.offsetHeight;
        const hOffset = (leftSide ? 10 : -(10 + rect.width));

        this.mainDiv.style.left = `${x + hOffset}px`;
        this.mainDiv.style.top = `${y - vOffset}px`;
    }
}

export {CommonPanel};