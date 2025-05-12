const { EchoRecorder } = echo;

const echoRecorder = new EchoRecorder();

async function start() {
    try {
        const subject = new signalR.Subject();
        const connection = await startConnection({
            onClose() {
                echoRecorder.close();
                subject.complete();
            }
        });

        await connection.send("Record", subject);
        
        for await (const echoData of echoRecorder.getChangesAsync()) {
            const data = echoData.toJson();
            subject.next(data);
        }

    } catch (err) {
        echoRecorder.cancel();
        throw err;
    }
}

window.addEventListener("DOMContentLoaded", start);

for (let i = 1; i <= 200; i++) {
    const p = document.createElement('p');
    p.textContent = "Scroll filler " + i + ": Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum efficitur justo sed sapien tincidunt, ut posuere orci lacinia.";
    document.body.querySelector('main').appendChild(p);
}

const generateBtn = document.getElementById('generate-btn');
const removeBtn = document.getElementById('remove-btn');
const container = document.getElementById('content-container');

let count = 0;

generateBtn.addEventListener('click', () => {
    const div = document.createElement('div');
    div.className = 'generated-item';
    div.style.padding = '10px';
    div.style.margin = '10px 0';
    div.style.backgroundColor = '#dff9fb';
    div.style.border = '1px solid #7ed6df';
    div.textContent = `Dynamically Generated Item ${++count}`;
    container.appendChild(div);
});

removeBtn.addEventListener('click', () => {
    if (container.lastElementChild) {
        container.removeChild(container.lastElementChild);
        count--;
    }
});