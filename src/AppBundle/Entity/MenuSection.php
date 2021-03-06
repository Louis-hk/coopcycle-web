<?php

namespace AppBundle\Entity;

use AppBundle\Entity\Base\CreativeWork;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Criteria;
use ApiPlatform\Core\Annotation\ApiProperty;
use ApiPlatform\Core\Annotation\ApiResource;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * A sub-grouping of food or drink items in a menu. E.g. courses (such as 'Dinner', 'Breakfast', etc.), specific type of dishes (such as 'Meat', 'Vegan', 'Drinks', etc.), or some other classification made by the menu provider.
 *
 * @see http://schema.org/MenuSection Documentation on Schema.org
 *
 * @ORM\Entity
 * @ORM\Table(name="menu_section_base")
 * @ApiResource(
 *  shortName="MenuSectionBase",
 *  iri="http://schema.org/MenuSection",
 *  attributes={
 *    "normalization_context"={"groups"={"restaurant"}}
 *  },
 *  collectionOperations={},
 *  itemOperations={
 *    "get"={"method"="GET"}
 *  })
 */
class MenuSection extends CreativeWork
{
    /**
     * @var int
     *
     * @ORM\Column(type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="IDENTITY")
     */
    private $id;

    /**
     * Gets id.
     *
     * @return int
     */
    public function getId()
    {
        return $this->id;
    }
}
