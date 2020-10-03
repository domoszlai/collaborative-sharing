import { classToPlain, plainToClass } from "class-transformer"
import { ClassType } from "class-transformer/ClassTransformer"

import { getNodeProps, getClassById } from './Annotation'
import { Plan, SharableScalar, SharableObject, SharableArray } from './Plan'

/** @internal */
export function serializeLeaf(value: any) {
    let nodeProps = getNodeProps(value)
    let serializeFn = nodeProps?.serializeFn ?? classToPlain
    let ret = serializeFn(value)

    if (typeof ret === "object" && nodeProps) {
        ret["__type"] = nodeProps.id
    }

    return ret
}

function deserializeLeaf(value: any) {
    if (typeof value === "object") {
        let t = getClassById(value["__type"])

        // Clone object before deleting '__type' field 
        value = Object.assign({}, value)
        delete value["__type"]

        if (t) {
            let props = getNodeProps(t)
            if (props) {
                let deserializeFn = props.deserializeFn
                if (deserializeFn) {
                    return deserializeFn(value)
                }
                else {
                    return plainToClass(t as ClassType<any>, value)
                }
            }
        }

        // Type could not be found
        return value
    }

    // Not object
    return value
}

function deserializeSharable(obj: any) {
    let isObj = typeof obj === "object"

    if (isObj && obj["__type"] === "__SharableObject") {
        let s = new SharableObject(obj.label)
        Object.entries(obj.ids).forEach(
            id => s.addId(id[0], deserializeLeaf(id[1])))
        Object.entries(obj.sharables).forEach(
            sharable => s.addSharable(sharable[0], deserializeSharable(sharable[1])))
        return s
    }
    else if (isObj && obj["__type"] === "__SharableArray") {
        let s = new SharableArray(obj.label)
        Array.from(obj.sharables).forEach(
            sharable => s.addSharable(deserializeSharable(sharable)))
        return s
    }
    else if (isObj && obj["__type"] === "__SharableScalar") {
        let s = new SharableScalar(obj.label, deserializeLeaf(obj.value))
        return s
    }

    throw ("Unrecognized sharable node")
}

export function serializePlan(plan: Plan): Object {
    return plan.serialize()
}

export function deserializePlan(serializedPlan: Object): Plan {
    return deserializeSharable(serializedPlan) as Plan
}