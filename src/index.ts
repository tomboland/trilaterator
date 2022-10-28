/*
References: 
    https://www.ijser.org/researchpaper/Wi-Fi-Indoor-Positioning-System-Based-on-RSSI-Measurements.pdf
    https://mathworld.wolfram.com/Circle-CircleIntersection.html
    https://www.cse.iitk.ac.in/users/amitangshu/southeastcon_localization-v6.pdf
    https://arxiv.org/pdf/1912.07801.pdf
    https://hal.archives-ouvertes.fr/hal-01764470/document
*/
import { lusolve } from 'mathjs'
import * as R from 'ramda'

const DECT_WAVELENGTH_METRES = 0.16
const SIGNAL_DECAY_CONSTANT = 4
const REFERENCE_DISTANCE = 1
const PATH_LOSS_AT_REFERENCE_DISTANCE = 2

// 72,,,,56,,,,72,,,,70,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,68

const baseMutualRSSIMap = [
    { 1: -50, 2: -79 },
    { 0: -52, 2: -92 },
    { 0: -73, 1: -92 },
]
const baseMutualRSSIMap2 = [
    { 1: -50, 2: -79 },
    { 0: -52, 2: -92 },
    { 0: -73, 1: -92 },
]
const basePositionsXY = [
    [-30, 0],
    [30, 0],
    [0, 30],
]

const headsetRSSIs = [-96, -96, -24]

// Equation (1) from https://hal.archives-ouvertes.fr/hal-01764470/document
// The value for n = 4.0 is taken from table III and baked in to the constant value (10n = 40).
// re-arranged to make d the subject
// $ \text{d} = $
export const pathLossDifferenceFromRSSI = (R: number): number => {
    const d0 = 1  // Reference distance (metres)
    const R0 = 27.14  // RSSI (PLD) measured at d0 (1m) value from table III in https://hal.archives-ouvertes.fr/hal-01764470/document
    const dist = d0 * Math.exp((Math.log(10)*(-R) - Math.log(10)*R0)/40)
    console.log({ R, dist })
    return dist
}


export const twoCirclesIntersect = (x1: number, y1: number, r1: number, x2: number, y2: number, r2: number): boolean => {
    const d = Math.sqrt((x1 - x2)**2 + (y1 - y2)**2)  // distance between centres
    return R.any(R.equals(true), [
        d === 0,  // circles are concentric
        d === r1,  // centre of one circle lies within the other
        d === r2,  // as above
        r1 - r2 === d,  // circles are touching, inside
        r1 + r2 === d,  // circles are touching, outside
        r1 - r2 < d && d < r1 + r2,  // circles intersect in two places
    ])
}


// Equation (8) from https://arxiv.org/pdf/1912.07801.pdf
// Solve the matrix equation AX = B
export const trilaterate3 = (basePositions: Array<Array<number>>, headsetRSSI: Array<number>) => {
    const [[x1, y1], [x2, y2], [x3, y3]] = basePositions
    const [d1, d2, d3] = headsetRSSI.map(pathLossDifferenceFromRSSI)
    const A = [
        [ -2 * (x1 - x3), -2 * (y1 - y3)],
        [ -2 * (x2 - x3), -2 * (y2 - y3)],
    ]
    const B = [
        [(d1**2 - d3**2) - (x1**2 - x3**2) - (y1**2 - y3**2)],
        [(d2**2 - d3**2) - (x2**2 - x3**2) - (y2**2 - y3**2)],
    ]
    console.log({ A, B })
    return lusolve(A, B)
}

const main = () => {
    console.log(trilaterate3(basePositionsXY, headsetRSSIs))
}

main()

