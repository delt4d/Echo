const { EchoMimic, EchoData } = echo;

async function start() {
    const echoMimic = new EchoMimic(document.getElementById("echo"));
    const connection = await startConnection();

    connection.stream("Mimic")
        .subscribe({
            async next(data) {
                await echoMimic.enqueueAsync(EchoData.fromJson(data));
            },
            error(err) {
                console.log(err);
            }
        });
}

window.addEventListener("DOMContentLoaded", start);

const minZoom = 32;
const maxZoom = 150;
const reactive = (defaultValue, ...listeners) => {
    let currentValue = defaultValue;

    const triggerListeners = (newValue = currentValue) => {
        listeners.forEach(listener => listener(newValue));
    }

    triggerListeners(defaultValue);

    return {
        addListener(cb) {
            listeners.push(cb);
        },
        get value() {
            return currentValue;
        },
        set value(newValue) {
            currentValue = newValue;
            triggerListeners(newValue);
        }
    }
}

const previousZoom = Number(localStorage.getItem("zoom"));
const currentIframeZoom = reactive(Number.isNaN(previousZoom) ? 90 : previousZoom, newZoom => {
    document.getElementById("echo").zoom(newZoom);
});

document.addEventListener('wheel', (e) => {
    if (!e.shiftKey) return;

    e.preventDefault();

    const direction = Math.sign(e.deltaY);
    const newValue = currentIframeZoom.value - direction * 5;

    currentIframeZoom.value = Math.min(maxZoom, Math.max(minZoom, newValue));
}, { passive: false });

currentIframeZoom.addListener(zoom => {
    localStorage.setItem("zoom", zoom);
});