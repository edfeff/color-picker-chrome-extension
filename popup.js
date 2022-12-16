const btn = document.querySelector('.changeColorBtn');
const clearColorBtn = document.querySelector('.clearColorBtn');
//
const colorPannel = document.querySelector('#colorPannel');
const colorGrid = document.querySelector('.colorGrid');
const colorValue = document.querySelector('.colorValue');

const notice = document.querySelector('#notice');

function noticeFunction(text) {
    if (text) {
        notice.innerText = text;
        notice.classList.add('active')
        setTimeout(() => {
            notice.classList.remove('active')
        }, 400);
    }
}

function init() {
    chrome.storage.local.get('colors', (result) => {
        let colors = []
        if (result.colors) {
            colors = result.colors
        }
        clearPannel();
        fillPannel(colors);
    });
}

init();

clearColorBtn.addEventListener('click', async () => {
    chrome.storage.local.set({ colors: [] }).then(() => {
    });
})

btn.addEventListener('click', async () => {
    // chrome.storage.local.get('color', ({ color }) => {
    //     console.log('color: ', color);
    // });
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript(
        {
            target: { tabId: tab.id },
            function: pickColor,
        },
        async (injectionResults) => {
            const [data] = injectionResults;
            if (data.result) {
                const color = data.result.sRGBHex;
                chrome.storage.local.get('colors', (result) => {
                    let colors = []
                    if (result.colors) {
                        colors = result.colors
                    }
                    colors.push(color);

                    chrome.storage.local.set({ colors: colors }).then(() => {
                    });
                });

                navigator.clipboard.writeText(color)
                    .then(() => {
                        noticeFunction("Copy " + color)
                    });
            }
        }
    );
});

async function pickColor() {
    try {
        // Picker
        const eyeDropper = new EyeDropper();
        return await eyeDropper.open();
    } catch (err) {
        console.error(err);
    }
}


chrome.storage.onChanged.addListener(
    (changes, areaName) => {
        if ("local" === areaName) {
            const { colors: { newValue } } = changes;
            fillPannel(newValue);
        }
    }
)

function clearPannel() {
    while (colorPannel.hasChildNodes()) {
        colorPannel.removeChild(colorPannel.firstChild);
    }
}

function fillPannel(colors) {
    clearPannel()
    colors.forEach(v => {
        const li = document.createElement("li");
        const color = document.createElement('span')
        color.classList.add('colorGrid');
        color.style.backgroundColor = v;

        const value = document.createElement('span')
        value.classList.add('colorValue');
        value.innerText = v;
        value.dataset['v'] = v;

        li.appendChild(color);
        li.appendChild(value);
        li.addEventListener("click", (env) => {
            let text = env.target.dataset.v;
            if (!text) {
                text = env.target.innerText | ""
            }
            navigator.clipboard.writeText(text).then(() => {
                noticeFunction("Copy " + text)
            }).catch((e) => {
                console.error(e)
            });
        })

        colorPannel.appendChild(li);
    });
}
