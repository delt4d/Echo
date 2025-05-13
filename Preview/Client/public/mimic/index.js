const { EchoMimic, EchoData } = echo;

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
        },
        setValueSilent(newValue) {
            currentValue = newValue;
        }
    }
}

async function start() {
    const echoMimic = new EchoMimic(document.getElementById("echo"));
    const connection = await startConnection();
    const history = [];
    
    let enqueueCanceled = false;
    let lastEchoHistoryProcessingId = 0;

    configureZoom();
    createPlayer();

    const removeListener = echoMimic.addListener(() => {
        if (enqueueCanceled) return;
        
        window.dispatchEvent(new CustomEvent("echo-auto-processed", {
            detail: history.length
        }));
    });

    window.addEventListener("echo-history-change", async ev => {
        const myProcessingId = ++lastEchoHistoryProcessingId;
        
        await echoMimic.cancelQueueExecution();
        
        enqueueCanceled = true;

        const index = Number(ev.detail);
        let currentIndex = 0;

        while (currentIndex++ < history.length) {
            if (myProcessingId !== lastEchoHistoryProcessingId) {
                // A new event was fired, cancel this one
                return;
            }
            
            const data = history[currentIndex];
            
            if (!data) {
                break;
            }
            
            if (currentIndex <= index) {
                await echoMimic.executeAsync(history[currentIndex]);
                continue;
            }

            await echoMimic.enqueueAsync(history[currentIndex]);
        }
    });
    
    connection.stream("Mimic")
        .subscribe({
            async next(json) {
                const data = EchoData.fromJson(json);
                
                history.push(data);

                window.dispatchEvent(new CustomEvent("history-count-change", {
                    detail: {
                        count: history.length,
                        autoProcessing: !enqueueCanceled
                    }
                }));
                
                if (!enqueueCanceled)
                    await echoMimic.enqueueAsync(data);
            },
            error(err) {
                console.log(err);
                removeListener();
            }
        });
}


window.addEventListener("DOMContentLoaded", start);

function createPlayer() {
    document.querySelectorAll(".player-container").forEach(el => {
        let count = 0;
        
        const cursor = el.querySelector(".cursor");
        const index = reactive(0,
        newIndex => {
            window.dispatchEvent(new CustomEvent("echo-history-change", {
                detail: newIndex
            }));
        });
        const progress = reactive(0, (newProgress) => {
            cursor.dataset.progress = String(newProgress) + "%";
            cursor.dataset.index = String(index.value);
            cursor.dataset.count = String(count);
            cursor.style.left = `${newProgress}%`;
        });
        
       
        let isDragging = false;
        let offsetX = 0;
        
        window.addEventListener("history-count-change", (ev) => {
           count = Number(ev.detail.count);
           
           if (!isDragging && !ev.detail.autoProcessing)
               progress.value = index.value/count*100;
        });

        window.addEventListener("echo-auto-processed", (ev) => {
            if (!isDragging) {
                index.setValueSilent(100);
                progress.value = 100;
            }
        });
        
        document.addEventListener("mouseup", ev => {
            if (!isDragging) return;
            cursor.style.cursor = "grab";
            isDragging = false;
        });
        
        document.addEventListener("mousemove", ev => {
            if (!isDragging) return;
            ev.preventDefault();
            
            const dropRect = el.getBoundingClientRect();
        
            let x = ev.clientX - dropRect.left - offsetX;
        
            // Constrain within drop zone
            const maxX = dropRect.width - cursor.offsetWidth;
            x = Math.max(0, Math.min(maxX, x));
        
            const percentage = (x / maxX) * 100;
            index.value = Math.floor((percentage / 100) * count);
            progress.value = index.value / count*100;
       });
       
       el.addEventListener("mousedown", ev => {
           ev.preventDefault();
           isDragging = true;
           cursor.style.cursor = "grabbing";
           const rect = cursor.getBoundingClientRect();
           offsetX = ev.clientX - rect.left;
       });
    });
}

function configureZoom() {
    const minZoom = 32;
    const maxZoom = 150;

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
    }, {passive: false});

    currentIframeZoom.addListener(zoom => {
        localStorage.setItem("zoom", zoom);
    });
}