import { CommonPanel } from "./CommonPanel.js";

class InfoPanel extends CommonPanel
{
    constructor(title)
    {
        super(title);

        this.mainDiv.classList.add("infoPanel");

        document.body.append(this.mainDiv);
        this.hide();
    }

    show(title, details, x, y)
    {
        while(this.contentDiv.firstChild)
            this.contentDiv.removeChild(this.contentDiv.firstChild);

        this.title.innerText = title;

        details.forEach(element => 
        {
            // console.log(element);

            const p = document.createElement("p");
            p.innerText = element ? element : (element === 0 ? 0 : "---");

            this.contentDiv.append(p);
        });

        this.mainDiv.style.display = "block";
        this.move(x, y);
    }    
}

export {InfoPanel};