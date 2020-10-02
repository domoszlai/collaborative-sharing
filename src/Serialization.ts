import {classToPlain, plainToClass} from "class-transformer"
import "class-transformer"

import {getNodeProps, getClassById} from './Annotation'
import {SharableScalar, SharableObject, SharableArray} from './Plan'
import { ClassType } from "class-transformer/ClassTransformer"

export function serializeLeaf(value: any)
{
    let nodeProps = getNodeProps(value)
    let serializeFn = nodeProps?.serializeFn ?? classToPlain
    let ret = serializeFn(value)

    if(typeof ret === "object" && nodeProps)
    {
        ret["__type"] = nodeProps.id
    }

    return ret
}

export function deserializeLeaf(value: any)
{
    if(typeof value === "object")
    {
        let t = getClassById(value["__type"])
        
        delete value["__type"]
        
        if(t)
        {
            let props = getNodeProps(t)
            if(props)
            {
                let deserializeFn = props.deserializeFn
                if(deserializeFn)
                {
                    return deserializeFn(value)
                }
                else
                {
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

function deserializeSharable(obj: any)
{
    let isObj = typeof obj === "object"

    if(isObj && obj["__type"] === "__SharableObject")
    {
        let s = new SharableObject(obj.title)
        Object.entries(obj.ids).forEach(
            id => s.addId(id[0], deserializeLeaf(id[1])))
        Object.entries(obj.sharables).forEach(
            sharable => s.addSharable(sharable[0], deserializeSharable(sharable[1])))
        return s
    }
    else if(isObj && obj["__type"] === "__SharableArray")
    {
        let s = new SharableArray(obj.title)
        Array.from(obj.sharables).forEach(
            sharable => s.addSharable(deserializeSharable(sharable)))
        return s
    }
    else if(isObj && obj["__type"] === "__SharableScalar")
    {
        let s = new SharableScalar(obj.title, deserializeLeaf(obj.value))
        return s
    }

    throw ("Unrecognized sharable node: " + JSON.stringify(obj))
}

export function deserializePlan(serializedPlan: Object)
{
    return deserializeSharable(serializedPlan);
}