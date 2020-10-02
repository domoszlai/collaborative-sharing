import {classToPlain} from "class-transformer"

import {getNodeProps} from './Annotation'

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
