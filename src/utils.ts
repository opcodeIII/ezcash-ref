export const randomInt = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

export const randomChoice = (array: Array<any>): any => {
    const length = array.length;
    const randomIndex = randomInt(0, length - 1);
    return array[randomIndex];
}

export const sleep = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}
