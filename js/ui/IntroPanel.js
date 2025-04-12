class IntroPanel
{
    constructor(control)
    {
        this.mainDiv = document.createElement("div");
        this.mainDiv.classList.add("fullScreen", "introPanel");

        const title = document.createElement("div");
        title.innerHTML = 
        `<svg viewBox="0 0 700 300" width="100%" height="100%" preserveAspectRatio="none">
            <path id="curve" d="M 0 300 Q 350 100 700 300" />
            <text width="700">
                <textPath xlink:href="#curve" startOffset="50">Lords of Heaven</textPath>
            </text>
        </svg>`;

        const newButton = document.createElement("button");
        newButton.addEventListener("click", control.handleNewGame.bind(control));
        newButton.textContent = "New Game";

        const loadButton = document.createElement("button");
        loadButton.addEventListener("click", control.handleLoadGame.bind(control));
        loadButton.textContent = "Load Game";

        const buttonDiv = document.createElement("div");
        buttonDiv.append(newButton, loadButton);

        this.mainDiv.append(title, buttonDiv);

        document.body.append(this.mainDiv);
    }

    hide()
    {
        this.display = this.mainDiv.style.display;

        this.mainDiv.style.display = "none";
    }

    show()
    {
        this.mainDiv.style.display = this.display;
    }
}

export {IntroPanel};