const minEatTimeout = 10;
const maxEatTimeout = 1000;

const minThinkTimeout = 10;
const maxThinkTimeout = 1000;

const defaultTimeout = 150;
const gapTimeout = 100;

async function spread(index, philosophersCount) {

    const forksBufferArray = new SharedArrayBuffer(parseInt(philosophersCount) * 4);
    const forksArray = new Int32Array(forksBufferArray);

    const leftFork = index;
    const rightFork = (leftFork + 1) % philosophersCount;

    const philosopherOnLeft = (philosophersCount + index - 1) % philosophersCount;
    const philosopherOnRight = rightFork;

    const think = new Promise((resolve) => {
        const timeToThink = minThinkTimeout + Math.random() * (maxThinkTimeout - minThinkTimeout)
        setTimeout(resolve, timeToThink);
    })

    const pickLeftFork = () => new Promise((resolve) => {
        while (true) {
            // check if the fork in that position is free to pick, if so - freeze for amount of time
            Atomics.wait(forksArray, leftFork, philosopherOnLeft, defaultTimeout + gapTimeout);

            //check if possible to pick the left fork
            if (Atomics.compareExchange(forksArray, leftFork, -1, index) === -1) {
                setTimeout(resolve, defaultTimeout);
                return;
            }
        }
    })

    const pickRightFork = () => new Promise((resolve) => {
        while (true) {
            Atomics.wait(forksArray, rightFork, philosopherOnRight, defaultTimeout + gapTimeout);

            if (Atomics.compareExchange(forksArray, rightFork, -1, index) === -1) {
                resolve();
                return;
            }
        }
    })

    const eat = () => new Promise((resolve) => {
        const timeToEat = minEatTimeout + Math.random() * (maxEatTimeout - minEatTimeout);
        setTimeout(resolve, timeToEat);
    })

    const putLeftFork = () => new Promise((resolve) => {
        Atomics.store(forksArray, leftFork, -1);
        Atomics.notify(forksArray, leftFork);
        resolve();
    })

    const putRightFork = () => new Promise((resolve) => {
        Atomics.store(forksArray, rightFork, -1);
        Atomics.notify(forksArray, rightFork);
        resolve();
    })

    return think
        .then(pickLeftFork)
        .then(pickRightFork)
        .then(eat)
        .then(putRightFork)
        .then(putLeftFork)
        .catch(reject => {
            console.log(reject)
        });
}
