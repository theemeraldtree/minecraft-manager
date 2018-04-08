import styled from 'styled-components';
import Badge from '../badge/badge';
const BadgeWrapper = styled.div`
    position: absolute;
    bottom: 0;
    right: 0;
`
const GenericBadge = styled(Badge)`
    position: absolute;
`
const TypeBadge = GenericBadge.extend`
    bottom: 10px;
    right: 10px;
    width: 55px;
`
const MCVersionBadge = GenericBadge.extend`
    width: 90px;
    bottom: 50px;
    right: 10px;
`
const ProfileVersionBadge = GenericBadge.extend`
    bottom: 10px;
    right: 85px;
    max-width: 165px;
    text-overflow: ellipsis;
`

export {
    BadgeWrapper,
    TypeBadge,
    MCVersionBadge,
    ProfileVersionBadge
}