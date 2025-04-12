class Slider
{
    constructor(container, precision, maximum, currentValues, label) // label is an object {text, cssClass}
    {
        this.list = new Map();

        const sliderDiv = document.createElement("div");
        sliderDiv.classList.add("sliderDiv");

        const currentSum = currentValues.reduce((sum, record) => sum + record.value, 0);
        const availableLabel = document.createElement("p");
        availableLabel.innerText = label.text;

        this.maxValueSpan = document.createElement("span");
        this.maxValueSpan.innerText = ` ${(maximum - currentSum).toFixed(precision)}${label?.suffix ? label.suffix : ""}`;
        availableLabel.append(this.maxValueSpan);

        if(label.cssClass)
            availableLabel.classList.add(label.cssClass);

        sliderDiv.append(availableLabel);

        currentValues.forEach(record => 
        {
            const content = document.createElement("div");
            const currentLabel = document.createElement("p");
            currentLabel.innerText = record.label;

            if(record.cssClass)
                currentLabel.classList.add(record.cssClass);

            const slider = document.createElement("input");
            slider.dataset.id = record.id;
            slider.type = "range";
            slider.max = maximum;
            slider.value = record.value;
            slider.step = 1 / (10 ** precision);

            this.list.set(record.id, slider);

            const number = document.createElement("p");
            number.innerText = `${slider.valueAsNumber.toFixed(precision)}${record.suffix ? record.suffix : ""}`;

            // need to re-examine this, may keep the listener but something else is needed.
            // the pattern is to update one slider at a time then call the dispaych which sends a message here
            // problem is if there are other sliders with values from a previous display of the slider you can get unexpected values
            slider.addEventListener("input", (evt) => 
            {
                const sumTargets = this.list.values().reduce((sum, t) => sum + t.valueAsNumber, 0);
                const currentAvailable = slider.max - sumTargets;
                const value = currentAvailable < 0 ? evt.target.valueAsNumber + currentAvailable : evt.target.valueAsNumber;

                this.maxValueSpan.innerText = ` ${currentAvailable < 0 ? 0 : currentAvailable.toFixed(precision)}${label?.suffix ? label.suffix : ""}`;
                number.innerText = `${value.toFixed(precision)}${record.suffix ? record.suffix : ""}`;
    
                if(currentAvailable < 0) 
                    evt.target.value = value; 
            });
    
            const valueDiv = document.createElement("div");
            valueDiv.append(slider, number);
    
            content.append(currentLabel, valueDiv);
            sliderDiv.append(content);        
        });

        container.append(sliderDiv);
    }

    clearValues()
    {
        this.list.forEach(slider => 
        {
            slider.value = 0;
        });
    }
}

export {Slider};