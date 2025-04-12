class DragControl
{
    constructor(main, handle)
    {
        this.main = main;

        this.dragData = {pos1: 0, pos2: 0, pos3: 0, pos4: 0, drag: this.handleDrag.bind(this), dragEnd: this.handleDragEnd.bind(this)};

        handle.addEventListener("mousedown", this.handleDragStart.bind(this));
    }

    handleDragStart(evt)
    {
        evt.preventDefault();

        this.dragData.pos1 = 0;
        this.dragData.pos2 = 0;
        this.dragData.pos3 = evt.clientX;
        this.dragData.pos4 = evt.clientY;

        document.addEventListener("mouseup", this.dragData.dragEnd);
        document.addEventListener("mousemove", this.dragData.drag);
    }

    handleDrag(evt)
    {
        evt.preventDefault();

        this.dragData.pos1 = this.dragData.pos3 - evt.clientX;
        this.dragData.pos2 = this.dragData.pos4 - evt.clientY;
        this.dragData.pos3 = evt.clientX;
        this.dragData.pos4 = evt.clientY;

        this.main.style.top = `${this.main.offsetTop - this.dragData.pos2}px`;
        this.main.style.left = `${this.main.offsetLeft - this.dragData.pos1}px`;
    }

    handleDragEnd(evt)
    {
        document.removeEventListener("mouseup", this.dragData.dragEnd);
        document.removeEventListener("mousemove", this.dragData.drag);
    }
}

export {DragControl};